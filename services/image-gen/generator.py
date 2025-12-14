"""
NewBie image model wrapper for card art generation.

Handles model loading, caching, and inference with optimizations for 16GB+ VRAM.
"""

import io
import logging
from pathlib import Path
from typing import Literal

import torch
from PIL import Image

logger = logging.getLogger(__name__)

# Model configuration
MODEL_ID = "NewBieAi-lab/NewBie-image-Exp0.1"
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 1024  # Portrait for card art
DEFAULT_STEPS = 28
DEFAULT_GUIDANCE = 7.0


class CardArtGenerator:
    """Manages NewBie model loading and image generation."""

    def __init__(
        self,
        model_id: str = MODEL_ID,
        device: str = "cuda",
        dtype: torch.dtype = torch.bfloat16,
        output_dir: Path | None = None,
    ):
        self.model_id = model_id
        self.device = device
        self.dtype = dtype
        self.output_dir = output_dir or Path("generated")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.pipe = None
        self._loaded = False

    def load_model(self) -> None:
        """Load the NewBie pipeline. Call once at startup."""
        if self._loaded:
            logger.info("Model already loaded")
            return

        logger.info(f"Loading NewBie model from {self.model_id}...")

        try:
            # Try ModelScope first (Chinese users), fall back to HuggingFace
            try:
                from modelscope import NewbiePipeline

                self.pipe = NewbiePipeline.from_pretrained(
                    self.model_id,
                    torch_dtype=self.dtype,
                )
            except ImportError:
                # Fall back to diffusers if modelscope not available
                from diffusers import DiffusionPipeline

                logger.info("ModelScope not available, trying HuggingFace...")
                self.pipe = DiffusionPipeline.from_pretrained(
                    "NewBie-AI/NewBie-image-Exp0.1",
                    torch_dtype=self.dtype,
                    trust_remote_code=True,
                )

            self.pipe = self.pipe.to(self.device)

            # Enable memory optimizations
            if hasattr(self.pipe, "enable_attention_slicing"):
                self.pipe.enable_attention_slicing()

            self._loaded = True
            logger.info("Model loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def unload_model(self) -> None:
        """Unload model to free VRAM."""
        if self.pipe is not None:
            del self.pipe
            self.pipe = None
            self._loaded = False
            torch.cuda.empty_cache()
            logger.info("Model unloaded")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def generate(
        self,
        prompt: str,
        width: int = DEFAULT_WIDTH,
        height: int = DEFAULT_HEIGHT,
        num_inference_steps: int = DEFAULT_STEPS,
        guidance_scale: float = DEFAULT_GUIDANCE,
        seed: int | None = None,
        negative_prompt: str | None = None,
    ) -> Image.Image:
        """
        Generate a single image from prompt.

        Args:
            prompt: Text prompt (natural language or XML structured)
            width: Output width (default 768 for card art)
            height: Output height (default 1024 for portrait cards)
            num_inference_steps: Denoising steps (default 28)
            guidance_scale: CFG scale (default 7.0)
            seed: Random seed for reproducibility
            negative_prompt: Negative prompt for exclusions

        Returns:
            PIL Image object
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)

        default_negative = (
            "worst quality, low quality, blurry, text, watermark, "
            "signature, username, artist name, logo, banner, "
            "multiple views, comic, manga panels"
        )
        neg = negative_prompt or default_negative

        logger.info(f"Generating image: {width}x{height}, steps={num_inference_steps}")

        with torch.inference_mode():
            result = self.pipe(
                prompt=prompt,
                negative_prompt=neg,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
            )

        return result.images[0]

    def generate_card_art(
        self,
        card_id: str,
        prompt: str,
        seed: int | None = None,
        format: Literal["png", "webp"] = "webp",
        quality: int = 90,
    ) -> tuple[bytes, str]:
        """
        Generate card art and return as bytes.

        Args:
            card_id: Unique card identifier for filename
            prompt: Generation prompt
            seed: Optional seed for reproducibility
            format: Output format (webp recommended for web)
            quality: Compression quality (1-100)

        Returns:
            Tuple of (image_bytes, filename)
        """
        image = self.generate(prompt=prompt, seed=seed)

        # Convert to bytes
        buffer = io.BytesIO()
        if format == "webp":
            image.save(buffer, format="WEBP", quality=quality)
        else:
            image.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)

        filename = f"{card_id}.{format}"
        return buffer.getvalue(), filename

    def save_card_art(
        self,
        card_id: str,
        prompt: str,
        seed: int | None = None,
        format: Literal["png", "webp"] = "webp",
    ) -> Path:
        """
        Generate and save card art to output directory.

        Returns:
            Path to saved image file
        """
        image_bytes, filename = self.generate_card_art(
            card_id=card_id,
            prompt=prompt,
            seed=seed,
            format=format,
        )

        output_path = self.output_dir / filename
        output_path.write_bytes(image_bytes)
        logger.info(f"Saved card art to {output_path}")

        return output_path


# Singleton instance for server use
_generator: CardArtGenerator | None = None


def get_generator() -> CardArtGenerator:
    """Get or create the singleton generator instance."""
    global _generator
    if _generator is None:
        _generator = CardArtGenerator()
    return _generator
