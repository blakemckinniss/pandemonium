#!/usr/bin/env python3
"""
PreToolUse hook: Ensure required servers are running before operations.

Gates operations that depend on specific servers:
- Image generation requires ComfyUI (8188) + image-gen (8420)
- Browser testing requires Vite (5173)
"""

import json
import re
import socket
import sys

# Server port definitions
PORTS = {
    "vite": 5173,
    "comfyui": 8188,
    "imagegen": 8420,
}

# Operations that require specific servers
SERVER_REQUIREMENTS = {
    # Pattern -> required servers
    r"localhost:5173": ["vite"],
    r"localhost:8188": ["comfyui"],
    r"localhost:8420": ["imagegen"],
    r"image-gen|imagegen": ["comfyui", "imagegen"],
    r"comfyui": ["comfyui"],
}


def is_port_open(port: int, timeout: float = 0.5) -> bool:
    """Quick port check."""
    try:
        with socket.create_connection(("localhost", port), timeout=timeout):
            return True
    except (OSError, TimeoutError):
        return False


def check_servers(required: list[str]) -> dict[str, bool]:
    """Check which required servers are running."""
    return {name: is_port_open(PORTS[name]) for name in required}


def get_required_servers(command: str) -> list[str]:
    """Determine which servers are required for a command."""
    required = set()
    command_lower = command.lower()

    # Don't block server START commands
    start_patterns = [
        r"start_optimized\.sh",
        r"server_manager\.py\s+(start|ensure)",
        r"nohup.*comfyui",
        r"python\s+server\.py",  # image-gen server start
    ]
    for pattern in start_patterns:
        if re.search(pattern, command_lower):
            return []  # Allow startup commands

    for pattern, servers in SERVER_REQUIREMENTS.items():
        if re.search(pattern, command_lower):
            required.update(servers)

    return list(required)


def format_server_status(status: dict[str, bool]) -> str:
    """Format server status for display."""
    lines = []
    for name, running in status.items():
        icon = "✅" if running else "❌"
        port = PORTS[name]
        lines.append(f"  {icon} {name} (:{port})")
    return "\n".join(lines)


def format_start_commands(missing: list[str]) -> str:
    """Format commands to start missing servers."""
    commands = {
        "vite": "npm run dev:vite",
        "comfyui": "~/ai/comfyui/start_optimized.sh",
        "imagegen": "cd services/image-gen && source .venv/bin/activate && python server.py &",
    }
    lines = ["**Start commands:**"]
    for name in missing:
        lines.append(f"  {name}: `{commands[name]}`")
    return "\n".join(lines)


def main():
    hook_input = json.load(sys.stdin)

    tool_name = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})

    # Only check Bash commands
    if tool_name != "Bash":
        print(json.dumps({"decision": "approve"}))
        return

    command = tool_input.get("command", "")

    # Find required servers
    required = get_required_servers(command)
    if not required:
        print(json.dumps({"decision": "approve"}))
        return

    # Check server status
    status = check_servers(required)
    missing = [name for name, running in status.items() if not running]

    if not missing:
        # All required servers running
        print(json.dumps({"decision": "approve"}))
        return

    # Some servers missing - BLOCK with helpful message
    print(
        json.dumps(
            {
                "decision": "block",
                "reason": f"""🚫 REQUIRED SERVERS NOT RUNNING

Your command requires servers that aren't running:

{format_server_status(status)}

{format_start_commands(missing)}

**Or use server manager:**
```bash
python .claude/hooks/server_manager.py ensure {missing[0]}
```

**Quick status check:**
```bash
python .claude/hooks/server_manager.py status
```
""",
            }
        )
    )


if __name__ == "__main__":
    main()
