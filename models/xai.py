"""
models/xai.py
=============
Explainable AI (XAI) & Grad-CAM Spatial Decision Heatmap Engine.
Inspired by Grad-CAM, Score-CAM, and remote sensing explainability frameworks.

Enables:
1. Generating spatial activation heatmaps showing which pixels influenced the model's
   cadastral classification (e.g. why a specific pixel was marked as Building vs Road).
2. Generating transparent, legally admissible AI audit reports for Gram Sabha &
   Revenue Court dispute resolution.
"""

from __future__ import annotations

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class CadastralGradCAM:
    """Gradient-weighted Class Activation Mapping (Grad-CAM) for Semantic Segmentation.

    Hooks into the final bottleneck/decoder layer to extract spatial gradients
    and compute class-specific activation intensity heatmaps.
    """

    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None) -> None:
        self.model = model
        self.target_layer = target_layer or (model.outc if hasattr(model, "outc") else list(model.modules())[-2])
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None
        self._hook_handles = []
        self._register_hooks()

    def _register_hooks(self) -> None:
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self._hook_handles.append(self.target_layer.register_forward_hook(forward_hook))
        self._hook_handles.append(self.target_layer.register_full_backward_hook(backward_hook))

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: int = 1,
    ) -> np.ndarray:
        """Generate Grad-CAM heatmap for a target class.

        Parameters
        ----------
        input_tensor : torch.Tensor
            Image tensor (1, C, H, W).
        target_class : int
            Semantic class ID to explain (1 = Building, 2 = Road, 3 = Water).

        Returns
        -------
        np.ndarray
            Normalized 2D heatmap in [0, 1] of shape (H, W).
        """
        self.model.eval()
        self.model.zero_grad()

        input_tensor = input_tensor.clone().requires_grad_(True)
        output = self.model(input_tensor)

        if isinstance(output, tuple):
            output = output[0]

        # Target score = sum of logits for the target class
        target_score = output[0, target_class].sum()
        target_score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            # Fallback simple gradient saliency
            grad = input_tensor.grad.data.abs().mean(dim=1)[0].cpu().numpy()
            grad = (grad - grad.min()) / (grad.max() - grad.min() + 1e-8)
            return grad

        # Global average pool gradients
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = F.relu(cam)

        cam = F.interpolate(
            cam,
            size=(input_tensor.shape[2], input_tensor.shape[3]),
            mode="bilinear",
            align_corners=False,
        )
        cam_np = cam[0, 0].cpu().numpy()

        cam_norm = (cam_np - cam_np.min()) / (cam_np.max() - cam_np.min() + 1e-8)
        return cam_norm

    def remove_hooks(self) -> None:
        for handle in self._hook_handles:
            handle.remove()


def generate_legal_audit_heatmap(
    rgb_img: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.5,
) -> np.ndarray:
    """Overlay a Grad-CAM heatmap onto the original drone image using JET colormap."""
    heatmap_uint8 = (heatmap * 255).astype(np.uint8)
    colored_cam = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    colored_cam = cv2.cvtColor(colored_cam, cv2.COLOR_BGR2RGB)

    overlay = cv2.addWeighted(rgb_img, 1.0 - alpha, colored_cam, alpha, 0)
    return overlay
