#!/bin/bash
# Conditional ComfyUI starter for npm run dev
# Only starts ComfyUI if: script exists AND (not running OR API unhealthy)

COMFYUI_SCRIPT="/home/jinx/ai/comfyui/start_optimized.sh"
COMFYUI_API="http://127.0.0.1:8188/system_stats"

# 1. Check if start script exists
if [[ ! -x "$COMFYUI_SCRIPT" ]]; then
    echo "[comfyui] start_optimized.sh not found or not executable, skipping"
    exit 0
fi

# 2. Check if API is reachable and healthy
check_api() {
    response=$(curl -s --connect-timeout 3 "$COMFYUI_API" 2>/dev/null)
    if [[ $? -eq 0 ]] && echo "$response" | grep -q '"comfyui_version"'; then
        return 0  # healthy
    fi
    return 1  # not healthy
}

if check_api; then
    echo "[comfyui] Already running and healthy, skipping startup"
    # Keep process alive so concurrently doesn't exit
    while true; do sleep 60; done
fi

# 3. Check for zombie processes (API not responding but process exists)
existing_pid=$(pgrep -f "ComfyUI.*main\.py|comfyui.*main\.py" 2>/dev/null | head -1)
if [[ -n "$existing_pid" ]]; then
    echo "[comfyui] Found unresponsive ComfyUI (PID $existing_pid), killing..."
    kill -9 "$existing_pid" 2>/dev/null
    sleep 2
fi

# 4. Start ComfyUI
echo "[comfyui] Starting ComfyUI..."
exec "$COMFYUI_SCRIPT"
