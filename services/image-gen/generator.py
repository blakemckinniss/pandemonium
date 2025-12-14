"""
ComfyUI API client for card art generation.

Connects to local or remote ComfyUI instance for image generation.
Supports any model configured in ComfyUI (NewBie, z-image, etc).

Configuration:
- COMFYUI_URL: ComfyUI server URL (default: http://127.0.0.1:8188)
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

# Default generation settings
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 1024  # Portrait for card art
DEFAULT_STEPS = 10  # z-image turbo is fast
DEFAULT_CFG = 1.0  # Turbo models use low CFG


def get_workflow(
    prompt: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    steps: int = DEFAULT_STEPS,
    cfg: float = DEFAULT_CFG,
    seed: int | None = None,
    negative_prompt: str = "",
    model: str = "z_image_turbo_fp8_e4m3fn.safetensors",
    clip: str = "qwen_3_4b.safetensors",
    vae: str = "ae.safetensors",
) -> dict:
    """
    Build a ComfyUI workflow for image generation.

    Uses z-image turbo by default (fast, good quality).
    """
    if seed is None:
        seed = random.randint(0, 2**32 - 1)

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
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": prompt}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 2.5}},
        "7": {
            "class_type": "EmptySD3LatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
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
                "scheduler": "beta",
                "denoise": 1.0,
            },
        },
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {
            "class_type": "SaveImage",
            "inputs": {"images": ["9", 0], "filename_prefix": "cardart"},
        },
    }

    return workflow


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
