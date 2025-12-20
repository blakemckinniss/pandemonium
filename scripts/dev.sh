#!/bin/bash
# Pandemonium Development Server Startup
# Robust startup with auto-recovery for all services

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMFYUI_DIR="$HOME/ai/comfyui"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEV]${NC} $1"; }
warn() { echo -e "${YELLOW}[DEV]${NC} $1"; }
err() { echo -e "${RED}[DEV]${NC} $1"; }

# Health check with retries
check_port() {
    local port=$1
    local name=$2
    local max_attempts=${3:-5}
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 2 "http://localhost:$port/health" >/dev/null 2>&1 || \
           curl -s --max-time 2 "http://localhost:$port/system_stats" >/dev/null 2>&1 || \
           curl -s --max-time 2 "http://localhost:$port" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        ((attempt++))
    done
    return 1
}

# Kill stale process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs -r kill -9 2>/dev/null || true
        sleep 1
        return 0
    fi
    return 1
}

echo ""
echo "🎮 Pandemonium Dev Environment"
echo "══════════════════════════════════════"

# 1. Clean up stale processes
log "Cleaning stale processes..."
kill_port 5173 && warn "Killed stale Vite on 5173"
kill_port 8420 && warn "Killed stale image-gen on 8420"

# 2. Check/Start ComfyUI
log "Checking ComfyUI (port 8188)..."
if check_port 8188 "ComfyUI" 2; then
    log "ComfyUI already running ✓"
else
    warn "ComfyUI not responding, checking for stale process..."
    if kill_port 8188; then
        warn "Killed stale ComfyUI process"
    fi

    log "Starting ComfyUI..."
    cd "$COMFYUI_DIR"
    nohup ./start_optimized.sh > /tmp/comfyui.log 2>&1 &
    COMFY_PID=$!

    log "Waiting for ComfyUI to initialize (up to 30s)..."
    if check_port 8188 "ComfyUI" 30; then
        log "ComfyUI started ✓ (PID: $COMFY_PID)"
    else
        err "ComfyUI failed to start. Check /tmp/comfyui.log"
        err "Continuing without image generation..."
    fi
fi

# 3. Start image-gen server
log "Starting image-gen server (port 8420)..."
cd "$PROJECT_ROOT/services/image-gen"
source .venv/bin/activate
nohup python server.py > /tmp/image-gen.log 2>&1 &
IMAGE_PID=$!

if check_port 8420 "image-gen" 5; then
    log "Image-gen running ✓ (PID: $IMAGE_PID)"
else
    err "Image-gen failed. Check /tmp/image-gen.log"
fi

# 4. Start Vite
log "Starting Vite dev server (port 5173)..."
cd "$PROJECT_ROOT"
npm run dev &
VITE_PID=$!

# Wait for Vite
sleep 2
if check_port 5173 "Vite" 10; then
    log "Vite running ✓ (PID: $VITE_PID)"
else
    err "Vite failed to start"
    exit 1
fi

# Final status
echo ""
echo "══════════════════════════════════════"
echo -e "${GREEN}✅ READY${NC} - http://localhost:5173"
echo "══════════════════════════════════════"
echo "  Vite:      http://localhost:5173 (PID $VITE_PID)"
echo "  Image-gen: http://localhost:8420 (PID $IMAGE_PID)"
echo "  ComfyUI:   http://localhost:8188"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup on exit
cleanup() {
    log "Shutting down..."
    kill $VITE_PID 2>/dev/null || true
    kill $IMAGE_PID 2>/dev/null || true
    # Don't kill ComfyUI - let it run
    log "Done"
}
trap cleanup EXIT

# Keep alive
wait $VITE_PID
