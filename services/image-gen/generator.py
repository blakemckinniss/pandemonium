"""
ComfyUI API client for card art generation.

Connects to local or remote ComfyUI instance for image generation.
Supports NewBie and z-image turbo models.

Configuration:
- COMFYUI_URL: ComfyUI server URL (default: http://127.0.0.1:8188)
- MODEL_TYPE: "newbie" or "turbo" (default: newbie)
- Uses websocket for progress tracking
- Retrieves images via /view endpoint
"""

import io
import json
import logging
import random
import time
import uuid
from pathlib import Path
from typing import Literal
from urllib import request

import websocket
from PIL import Image

logger = logging.getLogger(__name__)

# ComfyUI configuration
COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_WS = "ws://127.0.0.1:8188/ws"

# Model selection: "newbie" or "turbo"
MODEL_TYPE = "turbo"

# Default generation settings
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 1024  # Portrait for card art

# Model-specific settings
NEWBIE_STEPS = 25  # NewBie uses more steps
NEWBIE_CFG = 4.0  # NewBie uses standard CFG
TURBO_STEPS = 10  # z-image turbo is fast
TURBO_CFG = 1.0  # Turbo models use low CFG

# NewBie model paths (FP8 transformer, original text encoders)
NEWBIE_FP8_BASE = "/home/jinx/ai/comfyui/models/diffusers/NewBie-image-Exp0.1-fp8-e4m3fn"
NEWBIE_ORIG_BASE = "/home/jinx/ai/comfyui/models/diffusers/newbie-text-encoder"
NEWBIE_UNET_PATH = f"{NEWBIE_FP8_BASE}/transformer/diffusion_pytorch_model.safetensors"
NEWBIE_GEMMA_PATH = f"{NEWBIE_ORIG_BASE}/text_encoder"
NEWBIE_CLIP_PATH = f"{NEWBIE_ORIG_BASE}/clip_model"

# LoRA settings
DEFAULT_LORA = "Anime_Art_Zit_E10.safetensors"  # Anime style LoRA
DEFAULT_LORA_STRENGTH = 0.8

# Defaults based on model type
DEFAULT_STEPS = NEWBIE_STEPS if MODEL_TYPE == "newbie" else TURBO_STEPS
DEFAULT_CFG = NEWBIE_CFG if MODEL_TYPE == "newbie" else TURBO_CFG


def get_newbie_workflow(
    prompt: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    steps: int = NEWBIE_STEPS,
    cfg: float = NEWBIE_CFG,
    seed: int | None = None,
    vae: str = "ae.safetensors",
) -> dict:
    """Build a ComfyUI workflow for NewBie model generation."""
    if seed is None:
        seed = random.randint(0, 2**32 - 1)

    workflow = {
        # Load NewBie UNet (transformer)
        "1": {
            "class_type": "NewBieUNetLoader",
            "inputs": {"unet_path": NEWBIE_UNET_PATH},
        },
        # Load NewBie CLIP (Gemma3 + Jina CLIP v2)
        "2": {
            "class_type": "NewBieCLIPLoader",
            "inputs": {
                "gemma_model_path": NEWBIE_GEMMA_PATH,
                "jina_clip_path": NEWBIE_CLIP_PATH,
            },
        },
        # VAE loader (FLUX VAE)
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": vae}},
        # Text encoding
        "4": {
            "class_type": "NewBieCLIPTextEncode",
            "inputs": {"clip": ["2", 0], "user_prompt": prompt},
        },
        # Empty conditioning for negative
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        # Model sampling for NewBie
        "6": {
            "class_type": "ModelSamplingNewbie",
            "inputs": {"model": ["1", 0], "shift": 6.0},
        },
        # Latent image
        "7": {
            "class_type": "EmptySD3LatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        # Sampler
        "8": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["6", 0],
                "positive": ["4", 0],
                "negative": ["5", 0],
                "latent_image": ["7", 0],
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
            },
        },
        # Decode
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        # Save
        "10": {
            "class_type": "SaveImage",
            "inputs": {"images": ["9", 0], "filename_prefix": "newbie_cardart"},
        },
    }

    return workflow


def get_turbo_workflow(
    prompt: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    steps: int = TURBO_STEPS,
    cfg: float = TURBO_CFG,
    seed: int | None = None,
    model: str = "z_image_turbo_fp8_e4m3fn.safetensors",
    clip: str = "qwen_3_4b.safetensors",
    vae: str = "ae.safetensors",
    lora: str | None = None,
    lora_strength: float = 0.8,
) -> dict:
    """Build a ComfyUI workflow for z-image turbo (fast generation)."""
    if seed is None:
        seed = random.randint(0, 2**32 - 1)

    # Determine model/clip sources (direct or through LoRA)
    model_source = ["1", 0]
    clip_source = ["2", 0]

    # ComfyUI API workflow format
    workflow = {
        "1": {
            "class_type": "UNETLoader",
            "inputs": {"unet_name": model, "weight_dtype": "default"},
        },
        "2": {
            "class_type": "CLIPLoader",
            "inputs": {"clip_name": clip, "type": "lumina2", "device": "default"},
        },
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": vae}},
    }

    # Add LoRA loader if specified
    if lora:
        workflow["11"] = {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["1", 0],
                "clip": ["2", 0],
                "lora_name": lora,
                "strength_model": lora_strength,
                "strength_clip": lora_strength,
            },
        }
        model_source = ["11", 0]
        clip_source = ["11", 1]

    # Text encoding (uses LoRA-modified clip if applicable)
    workflow["4"] = {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": clip_source, "text": prompt},
    }
    workflow["5"] = {
        "class_type": "ConditioningZeroOut",
        "inputs": {"conditioning": ["4", 0]},
    }

    # Model sampling (uses LoRA-modified model if applicable)
    workflow["6"] = {
        "class_type": "ModelSamplingAuraFlow",
        "inputs": {"model": model_source, "shift": 2.5},
    }

    workflow["7"] = {
        "class_type": "EmptySD3LatentImage",
        "inputs": {"width": width, "height": height, "batch_size": 1},
    }
    workflow["8"] = {
        "class_type": "KSampler",
        "inputs": {
            "model": ["6", 0],
            "positive": ["4", 0],
            "negative": ["5", 0],
            "latent_image": ["7", 0],
            "seed": seed,
            "steps": steps,
            "cfg": cfg,
            "sampler_name": "euler",
            "scheduler": "beta",
            "denoise": 1.0,
        },
    }
    workflow["9"] = {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}}
    workflow["10"] = {
        "class_type": "SaveImage",
        "inputs": {"images": ["9", 0], "filename_prefix": "cardart"},
    }

    return workflow


def get_workflow(
    prompt: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    steps: int | None = None,
    cfg: float | None = None,
    seed: int | None = None,
    negative_prompt: str = "",
    lora: str | None = DEFAULT_LORA,
    lora_strength: float = DEFAULT_LORA_STRENGTH,
) -> dict:
    """
    Get workflow for current model type.

    Automatically selects NewBie or turbo workflow based on MODEL_TYPE.
    """
    if MODEL_TYPE == "newbie":
        return get_newbie_workflow(
            prompt=prompt,
            width=width,
            height=height,
            steps=steps or NEWBIE_STEPS,
            cfg=cfg or NEWBIE_CFG,
            seed=seed,
        )
    else:
        return get_turbo_workflow(
            prompt=prompt,
            width=width,
            height=height,
            steps=steps or TURBO_STEPS,
            cfg=cfg or TURBO_CFG,
            seed=seed,
            lora=lora,
            lora_strength=lora_strength,
        )


class CardArtGenerator:
    """ComfyUI API client for card art generation."""

    def __init__(
        self,
        comfyui_url: str = COMFYUI_URL,
        output_dir: Path | None = None,
    ):
        self.comfyui_url = comfyui_url.rstrip("/")
        self.ws_url = comfyui_url.replace("http://", "ws://").replace("https://", "wss://") + "/ws"
        self.output_dir = output_dir or Path("generated")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.client_id = str(uuid.uuid4())
        self._connected = False

    def check_connection(self) -> bool:
        """Check if ComfyUI server is reachable."""
        try:
            req = request.Request(f"{self.comfyui_url}/system_stats")
            with request.urlopen(req, timeout=5) as resp:
                self._connected = resp.status == 200
                return self._connected
        except Exception as e:
            logger.warning(f"ComfyUI not reachable: {e}")
            self._connected = False
            return False

    @property
    def is_connected(self) -> bool:
        return self._connected

    def queue_prompt(self, workflow: dict) -> str:
        """Submit workflow to ComfyUI queue. Returns prompt_id."""
        payload = {"prompt": workflow, "client_id": self.client_id}
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            f"{self.comfyui_url}/prompt", data=data, headers={"Content-Type": "application/json"}
        )

        with request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["prompt_id"]

    def wait_for_completion(self, prompt_id: str, timeout: float = 120) -> dict:
        """Wait for prompt completion via websocket. Returns execution info."""
        ws = websocket.create_connection(f"{self.ws_url}?clientId={self.client_id}")

        try:
            start = time.time()
            while time.time() - start < timeout:
                ws.settimeout(5)
                try:
                    msg = ws.recv()
                    if isinstance(msg, str):
                        data = json.loads(msg)
                        if data.get("type") == "executing":
                            exec_data = data.get("data", {})
                            if exec_data.get("prompt_id") == prompt_id:
                                if exec_data.get("node") is None:
                                    # Execution complete
                                    return {"status": "complete", "prompt_id": prompt_id}
                        elif data.get("type") == "execution_error":
                            return {"status": "error", "error": data.get("data")}
                except websocket.WebSocketTimeoutException:
                    continue

            return {"status": "timeout"}
        finally:
            ws.close()

    def get_images(self, prompt_id: str) -> list[Image.Image]:
        """Retrieve generated images from ComfyUI."""
        req = request.Request(f"{self.comfyui_url}/history/{prompt_id}")

        with request.urlopen(req) as resp:
            history = json.loads(resp.read().decode("utf-8"))

        images = []
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output:
                    for img_data in node_output["images"]:
                        filename = img_data["filename"]
                        subfolder = img_data.get("subfolder", "")
                        img_type = img_data.get("type", "output")

                        # Fetch image
                        params = f"filename={filename}&subfolder={subfolder}&type={img_type}"
                        img_req = request.Request(f"{self.comfyui_url}/view?{params}")

                        with request.urlopen(img_req) as img_resp:
                            img = Image.open(io.BytesIO(img_resp.read()))
                            images.append(img.copy())

        return images

    def generate(
        self,
        prompt: str,
        width: int = DEFAULT_WIDTH,
        height: int = DEFAULT_HEIGHT,
        steps: int = DEFAULT_STEPS,
        cfg: float = DEFAULT_CFG,
        seed: int | None = None,
        negative_prompt: str = "",
    ) -> Image.Image:
        """
        Generate a single image from prompt.

        Args:
            prompt: Text prompt for generation
            width: Output width (default 768)
            height: Output height (default 1024 for portrait cards)
            steps: Sampling steps (default 10 for turbo)
            cfg: CFG scale (default 1.0 for turbo)
            seed: Random seed for reproducibility
            negative_prompt: Negative prompt (unused for turbo)

        Returns:
            PIL Image object
        """
        if not self.check_connection():
            raise RuntimeError(f"ComfyUI not reachable at {self.comfyui_url}")

        workflow = get_workflow(
            prompt=prompt,
            width=width,
            height=height,
            steps=steps,
            cfg=cfg,
            seed=seed,
            negative_prompt=negative_prompt,
        )

        logger.info(f"Generating image: {width}x{height}, steps={steps}")

        prompt_id = self.queue_prompt(workflow)
        logger.info(f"Queued prompt: {prompt_id}")

        result = self.wait_for_completion(prompt_id)

        if result["status"] != "complete":
            raise RuntimeError(f"Generation failed: {result}")

        images = self.get_images(prompt_id)

        if not images:
            raise RuntimeError("No images returned from ComfyUI")

        return images[0]

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
