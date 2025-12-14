"""
FastAPI server for card art generation via ComfyUI.

Provides REST API endpoints for generating card art images.
Connects to a ComfyUI instance for actual generation.
"""

import logging
from pathlib import Path
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from generator import COMFYUI_URL, get_generator
from prompts import batch_prompt_from_card_def, card_to_prompt, card_to_xml_prompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Output directory for generated images
OUTPUT_DIR = Path(__file__).parent / "generated"
OUTPUT_DIR.mkdir(exist_ok=True)


app = FastAPI(
    title="Pandemonium Card Art Generator",
    description="Generate anime-style card art via ComfyUI",
    version="0.2.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class GenerateRequest(BaseModel):
    """Request body for image generation."""

    card_id: str = Field(..., description="Unique card identifier")
    name: str = Field(..., description="Card name")
    description: str = Field(..., description="Card effect description")
    theme: Literal["attack", "skill", "power", "curse", "status"] = Field(
        default="attack", description="Card type"
    )
    element: Literal["physical", "fire", "ice", "lightning", "void"] = Field(
        default="physical", description="Elemental affinity"
    )
    rarity: Literal["starter", "common", "uncommon", "rare"] = Field(
        default="common", description="Card rarity"
    )
    custom_hint: str | None = Field(default=None, description="Custom style hints")
    use_xml: bool = Field(default=False, description="Use XML structured prompt format")
    seed: int | None = Field(default=None, description="Random seed for reproducibility")
    format: Literal["png", "webp"] = Field(default="webp", description="Output format")


class GenerateResponse(BaseModel):
    """Response for successful generation."""

    card_id: str
    filename: str
    url: str
    prompt: str
    seed: int | None


class BatchRequest(BaseModel):
    """Request for batch generation."""

    cards: list[dict] = Field(..., description="List of card definitions")
    format: Literal["png", "webp"] = Field(default="webp")


class StatusResponse(BaseModel):
    """Server status response."""

    status: str
    comfyui_connected: bool
    comfyui_url: str
    output_dir: str


# Endpoints
@app.get("/health")
async def health_check() -> dict:
    """Simple health check."""
    return {"status": "ok"}


@app.get("/status", response_model=StatusResponse)
async def get_status() -> StatusResponse:
    """Get server and ComfyUI connection status."""
    generator = get_generator()
    connected = generator.check_connection()
    return StatusResponse(
        status="ready" if connected else "comfyui_not_connected",
        comfyui_connected=connected,
        comfyui_url=generator.comfyui_url,
        output_dir=str(generator.output_dir),
    )


@app.post("/generate", response_model=GenerateResponse)
async def generate_card_art(request: GenerateRequest) -> GenerateResponse:
    """
    Generate card art for a single card.

    Returns the generated image metadata and URL.
    """
    generator = get_generator()
    generator.output_dir = OUTPUT_DIR

    if not generator.check_connection():
        raise HTTPException(
            status_code=503,
            detail=f"ComfyUI not connected at {generator.comfyui_url}. Start ComfyUI first.",
        )

    # Build prompt
    if request.use_xml:
        prompt = card_to_xml_prompt(
            name=request.name,
            description=request.description,
            theme=request.theme,
            element=request.element,
            rarity=request.rarity,
            custom_hint=request.custom_hint,
        )
    else:
        prompt = card_to_prompt(
            name=request.name,
            description=request.description,
            theme=request.theme,
            element=request.element,
            rarity=request.rarity,
            custom_hint=request.custom_hint,
        )

    try:
        output_path = generator.save_card_art(
            card_id=request.card_id,
            prompt=prompt,
            seed=request.seed,
            format=request.format,
        )

        return GenerateResponse(
            card_id=request.card_id,
            filename=output_path.name,
            url=f"/images/{output_path.name}",
            prompt=prompt,
            seed=request.seed,
        )

    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/images/{filename}")
async def get_image(filename: str) -> Response:
    """Serve generated images."""
    image_path = OUTPUT_DIR / filename

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    content = image_path.read_bytes()
    media_type = "image/webp" if filename.endswith(".webp") else "image/png"

    return Response(content=content, media_type=media_type)


@app.post("/batch/start")
async def start_batch_generation(
    request: BatchRequest, background_tasks: BackgroundTasks
) -> JSONResponse:
    """
    Start batch generation of multiple cards in background.

    Returns immediately with a job ID to check progress.
    """
    generator = get_generator()
    generator.output_dir = OUTPUT_DIR

    if not generator.check_connection():
        raise HTTPException(status_code=503, detail="ComfyUI not connected")

    # Simple job tracking (in production, use Redis/DB)
    import uuid

    job_id = str(uuid.uuid4())[:8]

    async def run_batch():
        results = []
        for card_def in request.cards:
            try:
                prompt = batch_prompt_from_card_def(card_def)
                card_id = card_def.get("id", f"card_{len(results)}")

                output_path = generator.save_card_art(
                    card_id=card_id,
                    prompt=prompt,
                    format=request.format,
                )
                results.append({"card_id": card_id, "status": "success", "path": str(output_path)})
            except Exception as e:
                card_id_err = card_def.get("id", "unknown")
                results.append({"card_id": card_id_err, "status": "error", "error": str(e)})

        # Write results to file for retrieval
        import json

        results_path = OUTPUT_DIR / f"batch_{job_id}.json"
        results_path.write_text(json.dumps(results, indent=2))

    background_tasks.add_task(run_batch)

    return JSONResponse(
        content={
            "job_id": job_id,
            "status": "started",
            "total_cards": len(request.cards),
        }
    )


@app.get("/batch/{job_id}")
async def get_batch_status(job_id: str) -> JSONResponse:
    """Check batch job status and results."""
    import json

    results_path = OUTPUT_DIR / f"batch_{job_id}.json"

    if not results_path.exists():
        return JSONResponse(content={"job_id": job_id, "status": "in_progress"})

    results = json.loads(results_path.read_text())
    return JSONResponse(
        content={
            "job_id": job_id,
            "status": "completed",
            "results": results,
        }
    )


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server - will connect to ComfyUI at {COMFYUI_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8420)
