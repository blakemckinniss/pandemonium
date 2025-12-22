#!/usr/bin/env python3
"""
SessionStart hook: Display server status on session initialization.

Shows which of the 3 project servers are running so Claude knows
what's available before starting work.
"""

import json
import socket
import subprocess
import sys

# Server definitions with health check details
SERVERS = {
    "vite": {
        "name": "Vite Dev Server",
        "port": 5173,
        "health_url": "http://localhost:5173",
        "health_check": "http",  # Just check HTTP response
        "start_hint": "npm run dev:vite",
    },
    "comfyui": {
        "name": "ComfyUI",
        "port": 8188,
        "health_url": "http://localhost:8188/system_stats",
        "health_check": "json",  # Expect JSON response
        "start_hint": "~/ai/comfyui/start_optimized.sh",
    },
    "imagegen": {
        "name": "Image-gen API",
        "port": 8420,
        "health_url": "http://localhost:8420/health",
        "health_check": "json",  # Expect JSON with status
        "start_hint": "cd services/image-gen && python server.py &",
    },
}


def is_port_open(port: int, timeout: float = 0.5) -> bool:
    """Quick TCP port check."""
    try:
        with socket.create_connection(("localhost", port), timeout=timeout):
            return True
    except (OSError, TimeoutError):
        return False


def check_health(server_key: str) -> dict:
    """
    Check server health with actual HTTP validation.

    Returns dict with:
    - port_open: bool
    - healthy: bool (HTTP check passed)
    - details: str (extra info from health check)
    """
    server = SERVERS[server_key]
    port = server["port"]

    # First check if port is open
    if not is_port_open(port):
        return {"port_open": False, "healthy": False, "details": "Port closed"}

    # Port open - try HTTP health check
    try:
        result = subprocess.run(
            ["curl", "-s", "--connect-timeout", "2", "-m", "3", server["health_url"]],
            capture_output=True,
            text=True,
            timeout=5,
        )

        if result.returncode != 0:
            return {
                "port_open": True,
                "healthy": False,
                "details": "HTTP request failed",
            }

        response = result.stdout.strip()

        # Validate based on health_check type
        if server["health_check"] == "json":
            try:
                data = json.loads(response)
                # For image-gen, check status field
                if server_key == "imagegen":
                    status = data.get("status", "unknown")
                    comfy_ok = data.get("comfyui_available", False)
                    if status == "ok":
                        details = (
                            "Ready" if comfy_ok else "Ready (ComfyUI not connected)"
                        )
                        return {"port_open": True, "healthy": True, "details": details}
                    return {
                        "port_open": True,
                        "healthy": False,
                        "details": f"Status: {status}",
                    }
                # For ComfyUI, just check we got valid JSON
                return {"port_open": True, "healthy": True, "details": "GPU ready"}
            except json.JSONDecodeError:
                return {
                    "port_open": True,
                    "healthy": False,
                    "details": "Invalid JSON response",
                }
        else:
            # HTTP check - any response is good
            return {
                "port_open": True,
                "healthy": bool(response),
                "details": "Responding" if response else "Empty response",
            }

    except subprocess.TimeoutExpired:
        return {"port_open": True, "healthy": False, "details": "Health check timeout"}
    except Exception as e:
        return {"port_open": True, "healthy": False, "details": str(e)[:50]}


def format_status_line(key: str, health: dict) -> str:
    """Format a single server status line."""
    server = SERVERS[key]

    if health["healthy"]:
        icon = "✅"
        status = health["details"]
    elif health["port_open"]:
        icon = "⚠️"
        status = health["details"]
    else:
        icon = "❌"
        status = "Not running"

    return f"{icon} {server['name']} (:{server['port']}): {status}"


def main():
    # Read hook input (not used for SessionStart but required)
    try:
        json.load(sys.stdin)
    except Exception:
        pass

    # Check all servers
    lines = ["🖥️ **Pandemonium Server Status**"]

    all_healthy = True
    any_running = False

    for key in SERVERS:
        health = check_health(key)
        lines.append(f"  {format_status_line(key, health)}")

        if health["healthy"]:
            any_running = True
        else:
            all_healthy = False

    # Add helpful hints based on status
    if all_healthy:
        lines.append("\n✨ All servers ready!")
    elif not any_running:
        lines.append("\n💡 **Start servers:**")
        lines.append("```bash")
        lines.append("python .claude/hooks/server_manager.py ensure vite")
        lines.append("python .claude/hooks/server_manager.py ensure comfyui")
        lines.append("python .claude/hooks/server_manager.py ensure imagegen")
        lines.append("```")
    else:
        # Some running, some not
        lines.append(
            "\n💡 Use `python .claude/hooks/server_manager.py status` for details"
        )

    # Output as hook result
    print(json.dumps({"result": "\n".join(lines)}))


if __name__ == "__main__":
    main()
