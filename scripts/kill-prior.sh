#!/bin/bash
# Kill only zombie/unhealthy dev instances to prevent port stacking
# Does NOT kill healthy running services
# Does NOT touch ComfyUI (heavy to restart)

killed_any=false

# Kill zombie Vite processes (orphaned from prior sessions)
# Only kill if more than one Vite instance exists (port stacking)
vite_count="$(pgrep -c -f 'vite.*pandemonium' 2>/dev/null)" || vite_count=0
if [ "$vite_count" -gt 1 ]; then
    echo "[cleanup] Multiple Vite instances ($vite_count) - killing all to reset"
    pkill -f "vite.*pandemonium" 2>/dev/null
    killed_any=true
fi

# Kill image-gen only if unhealthy
if ! curl -s --connect-timeout 1 http://127.0.0.1:8420/health 2>/dev/null | grep -q '"status"'; then
    existing_pid="$(pgrep -f 'server\.py.*8420|uvicorn.*8420' 2>/dev/null | head -1)"
    if [ -n "$existing_pid" ]; then
        echo "[cleanup] Killing zombie image-gen (PID $existing_pid)"
        kill -9 "$existing_pid" 2>/dev/null
        killed_any=true
    fi
fi

# ComfyUI: Never kill - too heavy to restart
# The start-comfyui.sh script handles starting if needed

if [ "$killed_any" = true ]; then
    sleep 0.5
    echo "[cleanup] Zombie processes killed"
else
    echo "[cleanup] All services healthy, no cleanup needed"
fi
