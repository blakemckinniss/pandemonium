#!/usr/bin/env python3
"""
Server Manager for Pandemonium project.

Manages the 3 reserved server slots:
- Vite dev server (port 5173)
- ComfyUI (port 8188)
- Image-gen API (port 8420)

Can be used as:
1. Library: from server_manager import ServerManager
2. CLI: python server_manager.py status|start|stop [server_name]
3. Hook helper: provides server status for other hooks
"""

import json
import os
import socket
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

# Project root (relative to this hook file)
PROJECT_ROOT = Path(__file__).parent.parent.parent
SERVICES_DIR = PROJECT_ROOT / "services"


@dataclass
class ServerConfig:
    """Configuration for a managed server."""

    name: str
    port: int
    start_cmd: list[str]
    stop_pattern: str  # Pattern for pkill
    health_check: str  # URL or command to check health
    cwd: Path | None = None
    env: dict | None = None
    startup_wait: float = 2.0  # Seconds to wait after starting


# Server definitions
SERVERS: dict[str, ServerConfig] = {
    "vite": ServerConfig(
        name="Vite Dev Server",
        port=5173,
        start_cmd=["npm", "run", "dev:vite"],
        stop_pattern="vite",
        health_check="http://localhost:5173",
        cwd=PROJECT_ROOT,
        startup_wait=3.0,
    ),
    "comfyui": ServerConfig(
        name="ComfyUI",
        port=8188,
        start_cmd=[str(Path.home() / "ai/comfyui/start_optimized.sh")],
        stop_pattern="main.py.*--port.*8188",
        health_check="http://localhost:8188/system_stats",
        cwd=Path.home() / "ai/comfyui",
        startup_wait=30.0,  # GPU init takes time
    ),
    "imagegen": ServerConfig(
        name="Image-gen API",
        port=8420,
        start_cmd=[
            str(SERVICES_DIR / "image-gen/.venv/bin/python"),
            "server.py",
        ],
        stop_pattern="server.py.*8420|python.*server.py",
        health_check="http://localhost:8420/health",
        cwd=SERVICES_DIR / "image-gen",
        startup_wait=2.0,
    ),
}


def is_port_open(port: int, host: str = "localhost", timeout: float = 1.0) -> bool:
    """Check if a port is open (server listening)."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, TimeoutError):
        return False


def get_process_on_port(port: int) -> str | None:
    """Get process name/info running on a port."""
    try:
        result = subprocess.run(
            ["lsof", "-i", f":{port}", "-t"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if result.returncode == 0 and result.stdout.strip():
            pid = result.stdout.strip().split("\n")[0]
            # Get process name
            ps_result = subprocess.run(
                ["ps", "-p", pid, "-o", "comm="],
                capture_output=True,
                text=True,
                timeout=2,
            )
            return ps_result.stdout.strip() if ps_result.returncode == 0 else pid
    except Exception:
        pass
    return None


class ServerManager:
    """Manages Pandemonium's server infrastructure."""

    def __init__(self):
        self.servers = SERVERS

    def status(self, server_name: str | None = None) -> dict:
        """Get status of one or all servers."""
        if server_name:
            if server_name not in self.servers:
                return {"error": f"Unknown server: {server_name}"}
            return self._get_server_status(server_name)

        return {name: self._get_server_status(name) for name in self.servers}

    def _get_server_status(self, name: str) -> dict:
        """Get detailed status for a single server."""
        config = self.servers[name]
        port_open = is_port_open(config.port)
        process = get_process_on_port(config.port) if port_open else None

        return {
            "name": config.name,
            "port": config.port,
            "running": port_open,
            "process": process,
            "health_check": config.health_check,
        }

    def start(self, server_name: str) -> dict:
        """Start a server."""
        if server_name not in self.servers:
            return {"success": False, "error": f"Unknown server: {server_name}"}

        config = self.servers[server_name]

        # Check if already running
        if is_port_open(config.port):
            return {
                "success": True,
                "message": f"{config.name} already running on port {config.port}",
                "was_running": True,
            }

        # Start the server
        try:
            env = os.environ.copy()
            if config.env:
                env.update(config.env)

            # Start in background
            subprocess.Popen(
                config.start_cmd,
                cwd=config.cwd,
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )

            # Wait for startup
            time.sleep(config.startup_wait)

            # Verify it started
            if is_port_open(config.port):
                return {
                    "success": True,
                    "message": f"{config.name} started on port {config.port}",
                    "was_running": False,
                }
            else:
                return {
                    "success": False,
                    "error": f"{config.name} failed to start (port {config.port} not open after {config.startup_wait}s)",
                }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def stop(self, server_name: str) -> dict:
        """Stop a server."""
        if server_name not in self.servers:
            return {"success": False, "error": f"Unknown server: {server_name}"}

        config = self.servers[server_name]

        # Check if running
        if not is_port_open(config.port):
            return {
                "success": True,
                "message": f"{config.name} not running",
                "was_running": False,
            }

        # Stop the server
        try:
            subprocess.run(
                ["pkill", "-f", config.stop_pattern],
                capture_output=True,
                timeout=5,
            )

            # Wait and verify
            time.sleep(1)
            if not is_port_open(config.port):
                return {
                    "success": True,
                    "message": f"{config.name} stopped",
                    "was_running": True,
                }
            else:
                # Force kill
                subprocess.run(
                    ["pkill", "-9", "-f", config.stop_pattern],
                    capture_output=True,
                    timeout=5,
                )
                time.sleep(1)
                return {
                    "success": not is_port_open(config.port),
                    "message": f"{config.name} force stopped",
                    "was_running": True,
                }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def ensure_running(self, server_name: str) -> dict:
        """Ensure a server is running, starting it if needed."""
        status = self._get_server_status(server_name)
        if status.get("running"):
            return {"success": True, "action": "already_running", **status}

        result = self.start(server_name)
        return {"action": "started", **result}

    def status_summary(self) -> str:
        """Get a formatted status summary."""
        lines = ["Server Status:"]
        for name, status in self.status().items():
            icon = "✅" if status["running"] else "❌"
            lines.append(f"  {icon} {status['name']} (:{status['port']})")
        return "\n".join(lines)


def main():
    """CLI interface."""
    manager = ServerManager()

    if len(sys.argv) < 2:
        # Default: show status as JSON for hook usage
        print(json.dumps(manager.status(), indent=2))
        return

    action = sys.argv[1].lower()
    server = sys.argv[2] if len(sys.argv) > 2 else None

    if action == "status":
        if server:
            print(json.dumps(manager.status(server), indent=2))
        else:
            print(manager.status_summary())

    elif action == "start":
        if not server:
            print("Usage: server_manager.py start <server_name>")
            print(f"Available: {', '.join(SERVERS.keys())}")
            sys.exit(1)
        result = manager.start(server)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["success"] else 1)

    elif action == "stop":
        if not server:
            print("Usage: server_manager.py stop <server_name>")
            sys.exit(1)
        result = manager.stop(server)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["success"] else 1)

    elif action == "ensure":
        if not server:
            print("Usage: server_manager.py ensure <server_name>")
            sys.exit(1)
        result = manager.ensure_running(server)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["success"] else 1)

    elif action == "ports":
        # Quick port check for scripts
        for name, config in SERVERS.items():
            status = "UP" if is_port_open(config.port) else "DOWN"
            print(f"{config.port}:{status}:{name}")

    else:
        print(f"Unknown action: {action}")
        print("Usage: server_manager.py <status|start|stop|ensure|ports> [server_name]")
        sys.exit(1)


if __name__ == "__main__":
    main()
