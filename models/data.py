"""
models/data.py
==============
Dataset, data loading, and class-balanced sampling utilities for AeroSync.

Key design decisions:
- Spatially-correct splits by flight/region (not random patch), preventing
  adjacent-patch information leakage that inflates validation metrics by ~30%.
- Lazy loading: PIL open at __getitem__ only, not __init__, so the dataset
  object is lightweight and multiprocessing-safe with num_workers > 0.
- WeightedRandomSampler: Water Body (~2% of pixels) and small Building
  instances are chronically underrepresented. Class-balanced sampling fixes
  training signal imbalance without requiring per-class loss weighting tuning.
- Hard-example mining: log per-sample loss and resample hardest 15% at each
  epoch to force the model to address its worst failure modes.

Public API
----------
CadastralDroneDataset   : PyTorch Dataset for SVAMITVA patch imagery.
make_weighted_sampler   : Build WeightedRandomSampler from class pixel counts.
make_dataloaders        : One-call factory for train/val DataLoaders.
SpatialSplitter         : Split image file list by flight/region prefix.
HardExampleMiner        : Track per-sample loss, expose hardest indices.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Callable, Optional

import numpy as np
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler

logger = logging.getLogger(__name__)

# SVAMITVA colour-mask → class index mapping
# Colours match the original annotation convention in the dataset
_COLOR_TO_CLASS: list[tuple[tuple[int, int, int], int]] = [
    ((255, 165, 0),   1),   # Building  — orange
    ((255, 255, 0),   2),   # Road      — yellow
    ((0,   150, 255), 3),   # Water     — blue
    ((34,  139, 34),  4),   # Greenery  — dark green
    # Everything else → 0 (Background)
]

# Oversampling multipliers per class for WeightedRandomSampler
# Water Body is rare (~2% of pixels) → 5× oversampling
# Building kept at ~1.5× to address small-footprint misses
_CLASS_OVERSAMPLE_WEIGHTS: dict[int, float] = {
    0: 1.0,   # Background
    1: 1.5,   # Building
    2: 1.2,   # Road
    3: 5.0,   # Water Body (rare)
    4: 1.0,   # Greenery
}


# ---------------------------------------------------------------------------
# Helper: colour-mask → integer label
# ---------------------------------------------------------------------------

def _color_mask_to_label(mask_rgb: np.ndarray) -> np.ndarray:
    """Convert an RGB colour mask to a per-pixel integer class label map.

    Parameters
    ----------
    mask_rgb : np.ndarray
        RGB mask array of shape (H, W, 3), dtype uint8.

    Returns
    -------
    np.ndarray
        Integer label array of shape (H, W), dtype int64.
    """
    h, w = mask_rgb.shape[:2]
    label = np.zeros((h, w), dtype=np.int64)  # default = Background
    for (r, g, b), cls_id in _COLOR_TO_CLASS:
        match = (
            (mask_rgb[:, :, 0] > r - 40) & (mask_rgb[:, :, 0] < r + 40) &
            (mask_rgb[:, :, 1] > g - 40) & (mask_rgb[:, :, 1] < g + 40) &
            (mask_rgb[:, :, 2] > b - 40) & (mask_rgb[:, :, 2] < b + 40)
        )
        label[match] = cls_id
    return label


# ---------------------------------------------------------------------------
# 1. Dataset
# ---------------------------------------------------------------------------

class CadastralDroneDataset(Dataset):
    """PyTorch Dataset for SVAMITVA cadastral drone patch imagery.

    Supports lazy loading, albumentations augmentation, and optional
    per-sample loss tracking for hard-example mining.

    Parameters
    ----------
    img_paths : list[str]
        Paths to input image patches (PNG / JPG / TIF).
    mask_paths : list[str]
        Paths to corresponding RGB colour masks. May be shorter than
        ``img_paths``; samples without masks get an all-zero label.
    img_size : tuple[int, int]
        Target spatial resolution (H, W) — default (512, 512).
    transform : callable or None
        Albumentations ``Compose`` applied to both image and mask.
        When ``None``, only resize is applied.
    is_train : bool
        If True, augmentation is applied (transform is used). If False,
        the transform is still applied but should be a val-only pipeline.
    """

    def __init__(
        self,
        img_paths: list[str],
        mask_paths: list[str],
        img_size: tuple[int, int] = (512, 512),
        transform: Optional[Callable] = None,
        is_train: bool = True,
    ) -> None:
        self.img_paths = img_paths
        self.mask_paths = mask_paths
        self.img_size = img_size
        self.transform = transform
        self.is_train = is_train
        # Per-sample loss buffer for hard-example mining (initialised high)
        self._sample_losses: np.ndarray = np.ones(len(img_paths), dtype=np.float32)
        logger.info(
            "CadastralDroneDataset: %d images, %d masks, is_train=%s, size=%s",
            len(img_paths), len(mask_paths), is_train, img_size,
        )

    def __len__(self) -> int:
        return len(self.img_paths)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        # --- Lazy load image ---
        img = Image.open(self.img_paths[idx]).convert("RGB")
        img = img.resize(self.img_size[::-1], Image.BILINEAR)  # PIL uses (W, H)
        img_np = np.array(img, dtype=np.uint8)

        # --- Lazy load mask (all-zero if no mask file) ---
        if idx < len(self.mask_paths) and os.path.exists(self.mask_paths[idx]):
            mask = Image.open(self.mask_paths[idx]).convert("RGB")
            mask = mask.resize(self.img_size[::-1], Image.NEAREST)
            mask_np = np.array(mask, dtype=np.uint8)
            label_np = _color_mask_to_label(mask_np)
        else:
            label_np = np.zeros(self.img_size, dtype=np.int64)

        # --- Albumentations augmentation ---
        if self.transform is not None:
            try:
                result = self.transform(image=img_np, mask=label_np.astype(np.uint8))
                img_np = result["image"]
                label_np = result["mask"].astype(np.int64)
            except Exception as exc:
                logger.warning("Augmentation failed for sample %d: %s", idx, exc)

        # --- Normalise to [0, 1] and convert to tensor ---
        img_tensor = torch.from_numpy(img_np.copy()).permute(2, 0, 1).float() / 255.0
        label_tensor = torch.from_numpy(label_np.copy()).long()
        return img_tensor, label_tensor

    def update_sample_loss(self, idx: int, loss_value: float) -> None:
        """Update the per-sample loss tracker (used by HardExampleMiner).

        Parameters
        ----------
        idx : int
            Dataset sample index.
        loss_value : float
            Scalar loss value for this sample on the most recent forward pass.
        """
        self._sample_losses[idx] = float(loss_value)

    @property
    def sample_losses(self) -> np.ndarray:
        """Per-sample loss array, shape (N,)."""
        return self._sample_losses


# ---------------------------------------------------------------------------
# 2. Spatial splitter (by flight/region, not random)
# ---------------------------------------------------------------------------

class SpatialSplitter:
    """Split image paths by flight/region prefix for spatially-correct splits.

    Random patch-level splits leak information between adjacent patches that
    share the same aerial context, inflating validation IoU by ~30%. This
    splitter groups files by a region identifier (folder name or filename
    prefix up to a configurable separator) and splits at the region level.

    Parameters
    ----------
    separator : str
        Character used to extract the region prefix from filenames
        (default ``'_'`` — e.g. ``"flight01_patch003.png"`` → region ``"flight01"``).
    val_fraction : float
        Fraction of regions to use for validation (default 0.15).
    test_fraction : float
        Fraction of regions to use for test (default 0.15).
    seed : int
        Random seed for reproducible splits (default 42).
    """

    def __init__(
        self,
        separator: str = "_",
        val_fraction: float = 0.15,
        test_fraction: float = 0.15,
        seed: int = 42,
    ) -> None:
        self.separator = separator
        self.val_fraction = val_fraction
        self.test_fraction = test_fraction
        self.seed = seed

    def split(
        self, img_paths: list[str], mask_paths: list[str]
    ) -> tuple[tuple[list, list], tuple[list, list], tuple[list, list]]:
        """Split paths into (train, val, test) by region.

        Parameters
        ----------
        img_paths : list[str]
            All image file paths.
        mask_paths : list[str]
            All mask file paths (aligned with img_paths).

        Returns
        -------
        tuple of three (img_list, mask_list) pairs:
            ``(train, val, test)``
        """
        rng = np.random.default_rng(self.seed)

        # Extract region prefix from basename
        def _region(path: str) -> str:
            name = Path(path).stem
            return name.split(self.separator)[0] if self.separator in name else name

        # Group by region
        region_map: dict[str, list[int]] = {}
        for i, p in enumerate(img_paths):
            r = _region(p)
            region_map.setdefault(r, []).append(i)

        regions = list(region_map.keys())
        rng.shuffle(regions)

        n_val = max(1, int(len(regions) * self.val_fraction))
        n_test = max(1, int(len(regions) * self.test_fraction))
        n_train = len(regions) - n_val - n_test

        train_regions = set(regions[:n_train])
        val_regions = set(regions[n_train:n_train + n_val])
        test_regions = set(regions[n_train + n_val:])

        def _collect(region_set: set) -> tuple[list, list]:
            indices = [i for r in region_set for i in region_map[r]]
            imgs = [img_paths[i] for i in indices]
            masks = [mask_paths[i] for i in indices if i < len(mask_paths)]
            return imgs, masks

        train = _collect(train_regions)
        val = _collect(val_regions)
        test = _collect(test_regions)

        logger.info(
            "SpatialSplitter: %d train / %d val / %d test patches "
            "(%d / %d / %d regions)",
            len(train[0]), len(val[0]), len(test[0]),
            len(train_regions), len(val_regions), len(test_regions),
        )
        return train, val, test


# ---------------------------------------------------------------------------
# 3. Class-balanced sampler
# ---------------------------------------------------------------------------

def make_weighted_sampler(
    dataset: CadastralDroneDataset,
    num_samples: Optional[int] = None,
) -> WeightedRandomSampler:
    """Build a WeightedRandomSampler that oversamples rare classes.

    Computes per-sample weight as the sum of ``_CLASS_OVERSAMPLE_WEIGHTS``
    for each unique class present in the sample's mask. Samples containing
    Water Body or rare small Buildings get higher weights.

    Parameters
    ----------
    dataset : CadastralDroneDataset
        Dataset to compute weights for.
    num_samples : int or None
        Number of samples per epoch (default: len(dataset)).

    Returns
    -------
    WeightedRandomSampler
        Sampler ready to pass to DataLoader.
    """
    logger.info("Computing per-sample weights for class-balanced sampling...")
    weights = np.ones(len(dataset), dtype=np.float32)

    for idx in range(len(dataset)):
        _, label = dataset[idx]
        label_np = label.numpy()
        unique_classes = np.unique(label_np)
        sample_weight = sum(
            _CLASS_OVERSAMPLE_WEIGHTS.get(int(c), 1.0) for c in unique_classes
        )
        weights[idx] = sample_weight

    n = num_samples or len(dataset)
    sampler = WeightedRandomSampler(
        weights=torch.from_numpy(weights).float(),
        num_samples=n,
        replacement=True,
    )
    logger.info("WeightedRandomSampler: %d samples/epoch, weight range [%.2f, %.2f]",
                n, weights.min(), weights.max())
    return sampler


# ---------------------------------------------------------------------------
# 4. Hard-example miner
# ---------------------------------------------------------------------------

class HardExampleMiner:
    """Track per-sample losses and expose hardest samples for increased sampling.

    After each epoch, the trainer calls ``update(idx, loss)`` for every
    training sample. At the start of the next epoch, ``get_hard_indices()``
    returns the top-k% hardest samples whose weights can be boosted in the
    sampler.

    Parameters
    ----------
    n_samples : int
        Total number of training samples.
    hard_fraction : float
        Fraction of samples to classify as "hard" (default 0.15 = top 15%).
    """

    def __init__(self, n_samples: int, hard_fraction: float = 0.15) -> None:
        self.hard_fraction = hard_fraction
        self._losses = np.zeros(n_samples, dtype=np.float32)

    def update(self, idx: int, loss: float) -> None:
        """Record the loss for sample ``idx``."""
        self._losses[idx] = float(loss)

    def get_hard_indices(self) -> np.ndarray:
        """Return indices of the hardest (highest-loss) samples.

        Returns
        -------
        np.ndarray
            Integer array of hard sample indices.
        """
        threshold_rank = int(len(self._losses) * (1.0 - self.hard_fraction))
        threshold = np.sort(self._losses)[threshold_rank]
        return np.where(self._losses >= threshold)[0]

    def get_boosted_weights(self, base_weights: np.ndarray, boost: float = 3.0) -> np.ndarray:
        """Return a weight array with hard samples boosted.

        Parameters
        ----------
        base_weights : np.ndarray
            Existing per-sample weights (e.g. from make_weighted_sampler).
        boost : float
            Multiplier applied to hard samples (default 3.0×).

        Returns
        -------
        np.ndarray
            Updated weight array.
        """
        weights = base_weights.copy()
        hard_idx = self.get_hard_indices()
        weights[hard_idx] *= boost
        return weights


# ---------------------------------------------------------------------------
# 5. One-call DataLoader factory
# ---------------------------------------------------------------------------

def make_dataloaders(
    img_paths: list[str],
    mask_paths: list[str],
    img_size: int = 512,
    batch_size: int = 4,
    num_workers: int = 2,
    use_augmentation: bool = True,
    use_weighted_sampler: bool = True,
    val_fraction: float = 0.15,
    seed: int = 42,
    pin_memory: bool = True,
) -> tuple[DataLoader, DataLoader]:
    """Build train and validation DataLoaders with a spatially-correct split.

    Parameters
    ----------
    img_paths : list[str]
        All image file paths.
    mask_paths : list[str]
        All mask file paths.
    img_size : int
        Resize target (square, default 512).
    batch_size : int
        Training batch size (default 4).
    num_workers : int
        DataLoader worker processes (default 2).
    use_augmentation : bool
        Apply albumentations training augmentation (default True).
    use_weighted_sampler : bool
        Use class-balanced WeightedRandomSampler (default True).
    val_fraction : float
        Fraction of data for validation (default 0.15).
    seed : int
        Reproducibility seed (default 42).
    pin_memory : bool
        Pin memory for faster GPU transfer (default True).

    Returns
    -------
    tuple[DataLoader, DataLoader]
        ``(train_loader, val_loader)``
    """
    # Spatially-correct split
    splitter = SpatialSplitter(val_fraction=val_fraction, seed=seed)
    (train_imgs, train_masks), (val_imgs, val_masks), _ = splitter.split(
        img_paths, mask_paths
    )

    # Augmentation pipelines
    train_transform = val_transform = None
    try:
        from models.augmentation import get_train_transforms, get_val_transforms
        if use_augmentation:
            train_transform = get_train_transforms(img_size=img_size)
        val_transform = get_val_transforms(img_size=img_size)
    except ImportError:
        logger.warning("albumentations not available — using basic resize only.")

    train_ds = CadastralDroneDataset(
        train_imgs, train_masks,
        img_size=(img_size, img_size),
        transform=train_transform,
        is_train=True,
    )
    val_ds = CadastralDroneDataset(
        val_imgs, val_masks,
        img_size=(img_size, img_size),
        transform=val_transform,
        is_train=False,
    )

    sampler = None
    shuffle = True
    if use_weighted_sampler and len(train_ds) > 0:
        sampler = make_weighted_sampler(train_ds)
        shuffle = False  # sampler is mutually exclusive with shuffle

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=shuffle,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=pin_memory,
        drop_last=True,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
    )

    logger.info(
        "DataLoaders ready — train: %d batches, val: %d batches (batch_size=%d)",
        len(train_loader), len(val_loader), batch_size,
    )
    return train_loader, val_loader
