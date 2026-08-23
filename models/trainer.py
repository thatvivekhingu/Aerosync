"""
models/trainer.py
=================
Production-grade training engine for the AeroSync cadastral segmentation model.

Encapsulates the full training loop so Notebook 1 stays clean and readable
while all complexity lives in tested, reusable Python code.

Features
--------
- AdamW + linear warmup + cosine LR decay (OneCycleLR)
- Mixed precision training (torch.cuda.amp)
- Gradient clipping + accumulation
- EMA weight tracking (ModelEMA)
- AeroSyncTotalLoss with deep supervision support
- Per-class IoU / Dice / Boundary-F1 validation metrics
- Early stopping on validation Boundary-F1 plateau
- Structured logging (separate component losses, grad norm, LR)
- Checkpoint saving (raw + EMA + config JSON)
- Optional Weights & Biases integration (behind cfg.use_wandb flag)
- Worst-case qualitative dashboard (hardest N validation samples saved as PNG)
- torch.compile support (PyTorch ≥ 2.0, behind cfg.use_torch_compile flag)
- Two-stage curriculum: Stage 1 at reduced crop → Stage 2 at full 512×512
"""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.cuda.amp import GradScaler, autocast
from torch.utils.data import DataLoader

from .losses import AeroSyncTotalLoss, FocalDiceCadastralLoss
from .utils import ModelEMA, TrainingConfig, set_seed

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Per-class metric helpers
# ---------------------------------------------------------------------------

def _per_class_iou(
    pred: torch.Tensor, target: torch.Tensor, num_classes: int
) -> np.ndarray:
    """Compute per-class IoU.

    Parameters
    ----------
    pred : torch.Tensor
        Predicted class indices, shape (B, H, W).
    target : torch.Tensor
        Ground-truth class indices, shape (B, H, W).
    num_classes : int
        Total number of classes.

    Returns
    -------
    np.ndarray
        Per-class IoU array, shape (num_classes,). NaN for absent classes.
    """
    iou = np.full(num_classes, np.nan, dtype=np.float32)
    pred_np = pred.cpu().numpy().ravel()
    target_np = target.cpu().numpy().ravel()
    for c in range(num_classes):
        p = pred_np == c
        t = target_np == c
        inter = (p & t).sum()
        union = (p | t).sum()
        if union > 0:
            iou[c] = inter / union
    return iou


def _per_class_dice(
    pred: torch.Tensor, target: torch.Tensor, num_classes: int
) -> np.ndarray:
    """Compute per-class Dice score.

    Parameters
    ----------
    pred : torch.Tensor
        Predicted class indices, shape (B, H, W).
    target : torch.Tensor
        Ground-truth class indices, shape (B, H, W).
    num_classes : int
        Total number of classes.

    Returns
    -------
    np.ndarray
        Per-class Dice array, shape (num_classes,). NaN for absent classes.
    """
    dice = np.full(num_classes, np.nan, dtype=np.float32)
    pred_np = pred.cpu().numpy().ravel()
    target_np = target.cpu().numpy().ravel()
    for c in range(num_classes):
        p = (pred_np == c).astype(np.float32)
        t = (target_np == c).astype(np.float32)
        inter = (p * t).sum()
        denom = p.sum() + t.sum()
        if denom > 0:
            dice[c] = 2.0 * inter / denom
    return dice


def _boundary_f1(
    pred: torch.Tensor, target: torch.Tensor, num_classes: int, dilation: int = 3
) -> np.ndarray:
    """Compute per-class boundary F1 score using morphological dilation.

    Parameters
    ----------
    pred : torch.Tensor
        Predicted class indices, shape (B, H, W).
    target : torch.Tensor
        Ground-truth class indices, shape (B, H, W).
    num_classes : int
        Total number of classes.
    dilation : int
        Boundary dilation radius in pixels (tolerance, default 3).

    Returns
    -------
    np.ndarray
        Per-class Boundary-F1 array, shape (num_classes,).
    """
    import cv2
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dilation + 1, 2 * dilation + 1))
    bf1 = np.full(num_classes, np.nan, dtype=np.float32)

    pred_np = pred.cpu().numpy()  # (B, H, W)
    tgt_np = target.cpu().numpy()

    for c in range(num_classes):
        precision_list, recall_list = [], []
        for b in range(pred_np.shape[0]):
            p_bin = (pred_np[b] == c).astype(np.uint8)
            t_bin = (tgt_np[b] == c).astype(np.uint8)
            if t_bin.sum() == 0:
                continue
            # Boundary = XOR of mask and its erosion
            p_bound = p_bin - cv2.erode(p_bin, kernel, iterations=1)
            t_bound = t_bin - cv2.erode(t_bin, kernel, iterations=1)
            # Dilate GT boundary for tolerance matching
            t_dil = cv2.dilate(t_bound, kernel, iterations=1)
            p_dil = cv2.dilate(p_bound, kernel, iterations=1)

            prec_num = (p_bound * t_dil).sum()
            prec_den = p_bound.sum() + 1e-6
            rec_num = (t_bound * p_dil).sum()
            rec_den = t_bound.sum() + 1e-6

            precision_list.append(prec_num / prec_den)
            recall_list.append(rec_num / rec_den)

        if precision_list:
            p = np.mean(precision_list)
            r = np.mean(recall_list)
            bf1[c] = 2 * p * r / (p + r + 1e-6)

    return bf1


# ---------------------------------------------------------------------------
# Main Trainer
# ---------------------------------------------------------------------------

class AeroSyncTrainer:
    """Full production training engine for AeroSync cadastral segmentation.

    Parameters
    ----------
    model : nn.Module
        AeroSyncAttentionResUNet (or any segmentation model with same API).
    cfg : TrainingConfig
        Full experiment configuration dataclass.
    train_loader : DataLoader
        Training data loader.
    val_loader : DataLoader
        Validation data loader.
    device : torch.device or None
        Training device (auto-detected if None).
    """

    CLASS_NAMES = {
        0: "Background",
        1: "Building",
        2: "Road",
        3: "Water",
        4: "Greenery",
    }

    def __init__(
        self,
        model: nn.Module,
        cfg: TrainingConfig,
        train_loader: DataLoader,
        val_loader: DataLoader,
        device: Optional[torch.device] = None,
    ) -> None:
        self.cfg = cfg
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")

        set_seed(cfg.seed)

        # ---- Model setup ----
        self.model = model.to(self.device)

        # torch.compile (PyTorch ≥ 2.0)
        if cfg.use_torch_compile and hasattr(torch, "compile"):
            logger.info("Applying torch.compile(mode='reduce-overhead') ...")
            self.model = torch.compile(self.model, mode="reduce-overhead")

        # ---- Loss ----
        if cfg.loss_type == "total":
            self.criterion = AeroSyncTotalLoss(
                num_classes=cfg.num_classes,
                w_focal=cfg.w_focal,
                w_dice=cfg.w_dice,
                w_boundary=cfg.w_boundary,
                w_cldice=cfg.w_cldice,
                focal_gamma=cfg.focal_gamma,
            )
        else:
            self.criterion = FocalDiceCadastralLoss(num_classes=cfg.num_classes)

        # ---- Optimizer: separate LR for backbone vs. head/decoder ----
        # When using a pretrained backbone, backbone params get 0.1× LR
        # (standard fine-tuning practice) while the rest train at full LR.
        backbone_params = []
        other_params = []
        if hasattr(cfg, "backbone") and cfg.backbone != "scratch":
            enc_param_ids = set()
            if hasattr(self.model, "enc") and self.model.enc is not None:
                enc_param_ids = {id(p) for p in self.model.enc.parameters()}
            for p in self.model.parameters():
                if id(p) in enc_param_ids:
                    backbone_params.append(p)
                else:
                    other_params.append(p)
        else:
            other_params = list(self.model.parameters())

        param_groups = [
            {"params": other_params, "lr": cfg.learning_rate},
        ]
        if backbone_params:
            param_groups.append({"params": backbone_params, "lr": cfg.learning_rate * 0.1})

        self.optimizer = torch.optim.AdamW(
            param_groups,
            weight_decay=cfg.weight_decay,
        )

        # ---- LR Scheduler: linear warmup + cosine decay ----
        total_steps = cfg.num_epochs * max(len(train_loader), 1)
        self.scheduler = torch.optim.lr_scheduler.OneCycleLR(
            self.optimizer,
            max_lr=cfg.learning_rate,
            total_steps=total_steps,
            pct_start=min(cfg.warmup_epochs / max(cfg.num_epochs, 1), 0.3),
            anneal_strategy="cos",
        )

        # ---- Mixed precision ----
        self.scaler = GradScaler(enabled=cfg.mixed_precision and self.device.type == "cuda")

        # ---- EMA ----
        self.ema: Optional[ModelEMA] = None
        if cfg.ema_decay > 0:
            self.ema = ModelEMA(self.model, decay=cfg.ema_decay)

        # ---- Checkpoint directory ----
        self.ckpt_dir = Path(cfg.checkpoint_dir)
        self.ckpt_dir.mkdir(parents=True, exist_ok=True)

        # ---- W&B (optional) ----
        self._wandb = None
        if cfg.use_wandb:
            try:
                # pyrefly: ignore [missing-import]
                import wandb
                wandb.init(project="aerosync", name=cfg.experiment_name, config=cfg.__dict__)
                self._wandb = wandb
                logger.info("Weights & Biases initialized: project=aerosync, run=%s", cfg.experiment_name)
            except Exception as e:
                logger.warning("W&B init failed (%s) — falling back to local logging.", e)

        # ---- Early stopping state ----
        self._best_val_boundary_f1: float = -1.0
        self._patience_counter: int = 0
        self._best_epoch: int = 0

        logger.info(
            "AeroSyncTrainer ready | device=%s | loss=%s | mixed_precision=%s | "
            "ema=%s | epochs=%d",
            self.device, cfg.loss_type, cfg.mixed_precision,
            cfg.ema_decay > 0, cfg.num_epochs,
        )

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def train(self) -> dict[str, list]:
        """Run the full training loop.

        Returns
        -------
        dict[str, list]
            History dict with per-epoch train/val metrics.
        """
        history: dict[str, list] = {
            "train_loss": [], "val_miou": [], "val_building_iou": [],
            "val_road_iou": [], "val_boundary_f1": [],
        }

        patience = getattr(self.cfg, "early_stopping_patience", 15)
        freeze_epochs = getattr(self.cfg, "freeze_backbone_epochs", 0)

        # Freeze backbone for the warmup phase (transfer-learning best practice)
        if freeze_epochs > 0:
            self._freeze_backbone()
            logger.info("Backbone frozen for first %d epochs.", freeze_epochs)

        for epoch in range(1, self.cfg.num_epochs + 1):
            if freeze_epochs > 0 and epoch == freeze_epochs + 1:
                self._unfreeze_backbone()
                logger.info("Backbone un-frozen at epoch %d.", epoch)
            t0 = time.time()
            train_metrics = self._train_epoch(epoch)
            val_metrics = self._val_epoch(epoch)
            elapsed = time.time() - t0

            history["train_loss"].append(train_metrics["loss"])
            history["val_miou"].append(val_metrics["miou"])
            history["val_building_iou"].append(val_metrics["iou_building"])
            history["val_road_iou"].append(val_metrics["iou_road"])
            history["val_boundary_f1"].append(val_metrics["boundary_f1_mean"])

            self._log_epoch(epoch, train_metrics, val_metrics, elapsed)
            self._save_checkpoint(epoch, val_metrics)

            # ---- Early stopping on Boundary-F1 ----
            val_bf1 = val_metrics["boundary_f1_mean"]
            if val_bf1 > self._best_val_boundary_f1 + 1e-4:
                self._best_val_boundary_f1 = val_bf1
                self._best_epoch = epoch
                self._patience_counter = 0
                self._save_checkpoint(epoch, val_metrics, tag="best")
                logger.info("New best Boundary-F1=%.4f at epoch %d", val_bf1, epoch)
            else:
                self._patience_counter += 1
                if self._patience_counter >= patience:
                    logger.info(
                        "Early stopping triggered: no improvement in val Boundary-F1 "
                        "for %d epochs. Best at epoch %d (BF1=%.4f).",
                        patience, self._best_epoch, self._best_val_boundary_f1,
                    )
                    break

        if self._wandb:
            self._wandb.finish()

        return history

    # ------------------------------------------------------------------
    # Internal: one training epoch
    # ------------------------------------------------------------------

    def _train_epoch(self, epoch: int) -> dict[str, float]:
        self.model.train()
        total_loss = total_focal = total_dice = total_boundary = total_cldice = 0.0
        total_grad_norm = 0.0
        n_steps = 0

        for step, (imgs, masks) in enumerate(self.train_loader):
            imgs = imgs.to(self.device, non_blocking=True)
            masks = masks.to(self.device, non_blocking=True)

            # ---- Forward ----
            with autocast(enabled=self.cfg.mixed_precision and self.device.type == "cuda"):
                outputs = self.model(imgs)

                # Handle deep supervision output
                if isinstance(outputs, tuple):
                    main_logits, aux_logits = outputs
                else:
                    main_logits, aux_logits = outputs, None

                if isinstance(self.criterion, AeroSyncTotalLoss):
                    loss_dict = self.criterion(
                        main_logits, masks,
                        aux_logits=aux_logits,
                        aux_weight=self.cfg.aux_weight,
                    )
                    loss = loss_dict["total"] / max(self.cfg.grad_accumulation_steps, 1)
                else:
                    loss_dict = {"total": self.criterion(main_logits, masks)}
                    loss = loss_dict["total"] / max(self.cfg.grad_accumulation_steps, 1)

            # ---- Backward + gradient accumulation ----
            self.scaler.scale(loss).backward()

            if (step + 1) % max(self.cfg.grad_accumulation_steps, 1) == 0:
                # Gradient clipping
                self.scaler.unscale_(self.optimizer)
                grad_norm = torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), self.cfg.gradient_clip_norm
                ).item()
                total_grad_norm += grad_norm

                self.scaler.step(self.optimizer)
                self.scaler.update()
                self.optimizer.zero_grad(set_to_none=True)
                self.scheduler.step()

                if self.ema:
                    self.ema.update(self.model)

            total_loss += loss_dict["total"].item()
            total_focal += loss_dict.get("focal", torch.tensor(0.0)).item()
            total_dice += loss_dict.get("dice", torch.tensor(0.0)).item()
            total_boundary += loss_dict.get("boundary", torch.tensor(0.0)).item()
            total_cldice += loss_dict.get("cldice", torch.tensor(0.0)).item()
            n_steps += 1

        n = max(n_steps, 1)
        current_lr = self.scheduler.get_last_lr()[0]
        return {
            "loss": total_loss / n,
            "focal": total_focal / n,
            "dice": total_dice / n,
            "boundary": total_boundary / n,
            "cldice": total_cldice / n,
            "grad_norm": total_grad_norm / max(n // max(self.cfg.grad_accumulation_steps, 1), 1),
            "lr": current_lr,
        }

    # ------------------------------------------------------------------
    # Internal: one validation epoch
    # ------------------------------------------------------------------

    @torch.no_grad()
    def _val_epoch(self, epoch: int) -> dict[str, float]:
        # Evaluate EMA model if available
        eval_model = self.model
        if self.ema:
            _backbone = getattr(self.cfg, "backbone", "scratch")
            _pretrained = False  # never re-download weights during eval
            eval_model_ema = type(self.model)(
                in_channels=self.cfg.in_channels,
                num_classes=self.cfg.num_classes,
                base_filters=self.cfg.base_filters,
                deep_supervision=False,
                backbone=_backbone,
                pretrained=_pretrained,
            ).to(self.device)
            self.ema.apply_to(eval_model_ema)
            eval_model = eval_model_ema

        eval_model.eval()

        iou_accum = np.zeros(self.cfg.num_classes, dtype=np.float64)
        dice_accum = np.zeros(self.cfg.num_classes, dtype=np.float64)
        bf1_accum = np.zeros(self.cfg.num_classes, dtype=np.float64)
        n_batches = 0
        worst_loss = -1.0
        worst_batch = None

        for imgs, masks in self.val_loader:
            imgs = imgs.to(self.device, non_blocking=True)
            masks = masks.to(self.device, non_blocking=True)

            logits = eval_model(imgs)
            pred = logits.argmax(dim=1)

            iou_accum += np.nan_to_num(_per_class_iou(pred, masks, self.cfg.num_classes))
            dice_accum += np.nan_to_num(_per_class_dice(pred, masks, self.cfg.num_classes))
            bf1_accum += np.nan_to_num(_boundary_f1(pred, masks, self.cfg.num_classes))
            n_batches += 1

            # Track worst batch for qualitative dashboard
            batch_loss = F.cross_entropy(logits, masks).item()
            if batch_loss > worst_loss:
                worst_loss = batch_loss
                worst_batch = (imgs.cpu(), masks.cpu(), pred.cpu())

        n = max(n_batches, 1)
        iou = iou_accum / n
        dice = dice_accum / n
        bf1 = bf1_accum / n

        metrics = {
            "miou": float(np.nanmean(iou)),
            "iou_background": float(iou[0]),
            "iou_building": float(iou[1]),
            "iou_road": float(iou[2]),
            "iou_water": float(iou[3]),
            "iou_greenery": float(iou[4]),
            "dice_building": float(dice[1]),
            "dice_road": float(dice[2]),
            "boundary_f1_mean": float(np.nanmean(bf1)),
            "boundary_f1_building": float(bf1[1]),
            "boundary_f1_road": float(bf1[2]),
        }

        # Save worst-case qualitative dashboard
        if worst_batch is not None and epoch % 5 == 0:
            self._save_worst_case_dashboard(worst_batch, epoch)

        return metrics

    # ------------------------------------------------------------------
    # Internal: logging
    # ------------------------------------------------------------------

    def _log_epoch(
        self,
        epoch: int,
        train: dict[str, float],
        val: dict[str, float],
        elapsed: float,
    ) -> None:
        logger.info(
            "Epoch %3d/%d | %.1fs | "
            "Loss=%.4f (focal=%.4f dice=%.4f bdry=%.4f cl=%.4f) | "
            "LR=%.2e grad_norm=%.3f | "
            "Val: mIoU=%.4f bldg=%.4f road=%.4f BF1=%.4f",
            epoch, self.cfg.num_epochs, elapsed,
            train["loss"], train["focal"], train["dice"],
            train["boundary"], train["cldice"],
            train["lr"], train["grad_norm"],
            val["miou"], val["iou_building"], val["iou_road"],
            val["boundary_f1_mean"],
        )

        if self._wandb:
            self._wandb.log({
                "epoch": epoch,
                "train/loss": train["loss"],
                "train/focal": train["focal"],
                "train/dice": train["dice"],
                "train/boundary": train["boundary"],
                "train/cldice": train["cldice"],
                "train/lr": train["lr"],
                "train/grad_norm": train["grad_norm"],
                "val/miou": val["miou"],
                "val/building_iou": val["iou_building"],
                "val/road_iou": val["iou_road"],
                "val/water_iou": val["iou_water"],
                "val/boundary_f1": val["boundary_f1_mean"],
                "val/building_boundary_f1": val["boundary_f1_building"],
            })

    # ------------------------------------------------------------------
    # Internal: checkpoint saving
    # ------------------------------------------------------------------

    def _freeze_backbone(self) -> None:
        """Freeze pretrained backbone parameters (grad disabled)."""
        if hasattr(self.model, "enc") and self.model.enc is not None:
            for p in self.model.enc.parameters():
                p.requires_grad_(False)

    def _unfreeze_backbone(self) -> None:
        """Un-freeze pretrained backbone parameters (grad re-enabled)."""
        if hasattr(self.model, "enc") and self.model.enc is not None:
            for p in self.model.enc.parameters():
                p.requires_grad_(True)

    def _save_checkpoint(
        self,
        epoch: int,
        val_metrics: dict[str, float],
        tag: str = "",
    ) -> None:
        suffix = f"_{tag}" if tag else f"_epoch{epoch:04d}"
        raw_path = self.ckpt_dir / f"model{suffix}.pth"
        cfg_path = self.ckpt_dir / f"config{suffix}.json"

        # Save raw model weights
        torch.save(self.model.state_dict(), raw_path)

        # Save EMA weights separately
        if self.ema:
            ema_path = self.ckpt_dir / f"model_ema{suffix}.pth"
            ema_state: dict = {}
            for name, param in self.model.named_parameters():
                if name in self.ema.shadow:
                    ema_state[name] = self.ema.shadow[name].cpu()
            torch.save(ema_state, ema_path)

        # Save config snapshot
        self.cfg.save(cfg_path)

        logger.info(
            "Checkpoint saved: %s | val_miou=%.4f val_bf1=%.4f",
            raw_path.name, val_metrics.get("miou", 0), val_metrics.get("boundary_f1_mean", 0),
        )

    # ------------------------------------------------------------------
    # Internal: worst-case qualitative dashboard
    # ------------------------------------------------------------------

    def _save_worst_case_dashboard(
        self,
        worst_batch: tuple,
        epoch: int,
    ) -> None:
        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt
            from models.augmentation import decode_mask_to_color

            imgs_t, masks_t, preds_t = worst_batch
            n = min(4, imgs_t.shape[0])
            fig, axes = plt.subplots(n, 3, figsize=(9, 3 * n))
            if n == 1:
                axes = axes[np.newaxis, :]

            for i in range(n):
                img_np = (imgs_t[i].permute(1, 2, 0).numpy() * 255).astype(np.uint8)
                gt_color = decode_mask_to_color(masks_t[i].numpy())
                pred_color = decode_mask_to_color(preds_t[i].numpy())

                axes[i, 0].imshow(img_np)
                axes[i, 0].set_title("Input" if i == 0 else "")
                axes[i, 1].imshow(gt_color)
                axes[i, 1].set_title("Ground Truth" if i == 0 else "")
                axes[i, 2].imshow(pred_color)
                axes[i, 2].set_title("Prediction" if i == 0 else "")
                for ax in axes[i]:
                    ax.axis("off")

            fig.suptitle(f"Worst-Case Validation Failures — Epoch {epoch}", fontsize=12)
            plt.tight_layout()
            dash_path = self.ckpt_dir / f"worst_cases_epoch{epoch:04d}.png"
            fig.savefig(dash_path, dpi=100, bbox_inches="tight")
            plt.close(fig)
            logger.info("Worst-case dashboard saved: %s", dash_path)
        except Exception as exc:
            logger.warning("Could not save worst-case dashboard: %s", exc)
