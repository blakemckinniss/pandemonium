"""
NewBie image model wrapper for card art generation.

Handles model loading, caching, and inference.
Uses Disty0's diffusers-compatible conversion of NewBie-image-Exp0.1.

Memory modes:
- resident=True (default): Keep model in VRAM (~17GB). Faster inference.
- resident=False: CPU offload for 16GB VRAM systems. Slower but works.
"""

import io
import logging
from pathlib import Path
from typing import Literal

import torch
from PIL import Image

logger = logging.getLogger(__name__)

# Model configuration - Disty0's diffusers-compatible conversion
MODEL_ID = "Disty0/NewBie-image-Exp0.1-Diffusers"
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 1024  # Portrait for card art
DEFAULT_STEPS = 30
DEFAULT_GUIDANCE = 2.5  # NewBie works best with lower CFG


class CardArtGenerator:
    """Manages NewBie model loading and image generation."""

    def __init__(
        self,
        model_id: str = MODEL_ID,
        device: str = "cuda",
        dtype: torch.dtype = torch.bfloat16,
        output_dir: Path | None = None,
        resident: bool = True,
    ):
        self.model_id = model_id
        self.device = device
        self.dtype = dtype
        self.output_dir = output_dir or Path("generated")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.resident = resident  # True = keep in VRAM, False = CPU offload
        self.pipe = None
        self._loaded = False

    def load_model(self) -> None:
        """Load the NewBie pipeline. Call once at startup."""
        if self._loaded:
            logger.info("Model already loaded")
            return

        logger.info(f"Loading NewBie model from {self.model_id}...")

        try:
            from diffusers import NewbiePipeline
            from transformers import AutoModel

            # Load text_encoder_2 (Jina CLIP) separately with trust_remote_code
            logger.info("Loading text_encoder_2 (Jina CLIP)...")
            text_encoder_2 = AutoModel.from_pretrained(
                self.model_id,
                subfolder="text_encoder_2",
                trust_remote_code=True,
                torch_dtype=self.dtype,
            )

            # Load the pipeline with the pre-loaded text_encoder_2
            logger.info("Loading NewbiePipeline...")
            self.pipe = NewbiePipeline.from_pretrained(
                self.model_id,
                text_encoder_2=text_encoder_2,
                torch_dtype=self.dtype,
            )
            del text_encoder_2  # Free memory, pipeline holds reference

            if self.resident:
                # Keep entire model in VRAM for faster inference (~17GB)
                logger.info("Moving pipeline to GPU (resident mode)...")
                self.pipe = self.pipe.to(self.device)
            else:
                # CPU offload for 16GB VRAM systems
                logger.info("Enabling CPU offload (low-VRAM mode)...")
                self.pipe.enable_model_cpu_offload(device=self.device)
                self.pipe.text_encoder_2 = self.pipe.text_encoder_2.to(self.device)

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
            "blurry, worst quality, low quality, deformed hands, bad anatomy, "
            "extra limbs, poorly drawn face, mutated, extra eyes, bad proportions"
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
