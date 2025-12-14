#!/bin/bash
# Setup script for NewBie image generation service
# Requires: Python 3.10+, CUDA-capable GPU with 16GB+ VRAM

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Pandemonium Card Art Generator Setup ==="
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ $(echo "$PYTHON_VERSION < 3.10" | bc -l) -eq 1 ]]; then
    echo "Error: Python 3.10+ required (found $PYTHON_VERSION)"
    exit 1
fi
echo "✓ Python $PYTHON_VERSION"

# Check CUDA
if command -v nvidia-smi &> /dev/null; then
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1)
    echo "✓ CUDA available (${GPU_MEM}MB VRAM)"
else
    echo "⚠ nvidia-smi not found - GPU support may not work"
fi

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate and install
echo ""
echo "Installing dependencies..."
source .venv/bin/activate
pip install --upgrade pip -q

# Install PyTorch with CUDA first
if ! python -c "import torch; assert torch.cuda.is_available()" 2>/dev/null; then
    echo "Installing PyTorch with CUDA support..."
    pip install torch --index-url https://download.pytorch.org/whl/cu121 -q
fi

# Install diffusers from Disty0's fork (includes NewbiePipeline)
echo "Installing diffusers with NewbiePipeline support..."
pip install git+https://github.com/Disty0/diffusers.git -q

# Install additional dependencies
echo "Installing model dependencies..."
pip install einops timm torchvision transformers accelerate safetensors -q

# Install project
pip install -e . -q

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the service:"
echo "  cd $SCRIPT_DIR"
echo "  source .venv/bin/activate"
echo "  python server.py"
echo ""
echo "The service will:"
echo "  1. Load the NewBie model (~1-2 minutes first time)"
echo "  2. Listen on http://localhost:8420"
echo ""
echo "First run will download ~15GB of model files."
