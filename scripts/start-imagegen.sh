#!/bin/bash
# Conditional image-gen starter for npm run dev
# Only starts if not already running

IMAGEGEN_DIR="/home/jinx/projects/pandemonium/services/image-gen"
IMAGEGEN_API="http://localhost:8420/health"

# 1. Check if service directory exists
if [[ ! -d "$IMAGEGEN_DIR" ]]; then
    echo "[imagegen] Service directory not found, skipping"
    exit 0
fi

# 2. Check if API is reachable and healthy
check_api() {
    response=$(curl -s --connect-timeout 2 "$IMAGEGEN_API" 2>/dev/null)
    if [[ $? -eq 0 ]] && echo "$response" | grep -q '"status"'; then
        return 0  # healthy
    fi
    return 1  # not healthy
}

if check_api; then
    echo "[imagegen] Already running and healthy, skipping startup"
    # Keep process alive so concurrently doesn't exit
    while true; do sleep 60; done
fi

# 3. Check for zombie processes
existing_pid=$(pgrep -f "uvicorn.*8420|server\.py.*8420" 2>/dev/null | head -1)
if [[ -n "$existing_pid" ]]; then
    echo "[imagegen] Found unresponsive image-gen (PID $existing_pid), killing..."
    kill -9 "$existing_pid" 2>/dev/null
    sleep 1
fi

# 4. Start image-gen service
echo "[imagegen] Starting image-gen service..."
cd "$IMAGEGEN_DIR"
source .venv/bin/activate
exec python server.py
