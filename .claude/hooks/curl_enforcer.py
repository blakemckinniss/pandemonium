#!/usr/bin/env python3
"""
PreToolUse hook: Enforce curl timeouts and provide helpful alternatives.

Prevents hanging curl commands by:
1. Blocking curl without timeout flags
2. Suggesting proper timeout usage
3. Recommending server status checks first
"""

import json
import re
import sys

# Maximum allowed timeout in seconds
MAX_TIMEOUT = 10
DEFAULT_TIMEOUT = 5


def extract_curl_timeout(command: str) -> int | None:
    """Extract timeout value from curl command, return None if not set."""
    # Check for --connect-timeout or -m/--max-time
    patterns = [
        r"--connect-timeout\s+(\d+)",
        r"--max-time\s+(\d+)",
        r"-m\s+(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, command)
        if match:
            return int(match.group(1))
    return None


def is_curl_command(command: str) -> bool:
    """Check if command contains curl."""
    # Match curl at word boundary (not curling, etc.)
    return bool(re.search(r"\bcurl\b", command))


def main():
    # Read hook input from stdin
    hook_input = json.load(sys.stdin)

    tool_name = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})

    # Only process Bash tool
    if tool_name != "Bash":
        print(json.dumps({"decision": "approve"}))
        return

    command = tool_input.get("command", "")

    # Check if it's a curl command
    if not is_curl_command(command):
        print(json.dumps({"decision": "approve"}))
        return

    # Check for timeout
    timeout = extract_curl_timeout(command)

    if timeout is None:
        # BLOCK: No timeout specified
        print(
            json.dumps(
                {
                    "decision": "block",
                    "reason": f"""🚫 CURL WITHOUT TIMEOUT BLOCKED

Your curl command has no timeout, which can hang indefinitely.

**Fix options:**
1. Add timeout: `curl --connect-timeout {DEFAULT_TIMEOUT} -m {MAX_TIMEOUT} ...`
2. Use server status check first: `pgrep -f "server.py" && curl ...`
3. Use WebFetch tool instead (has built-in timeout)

**Project servers:**
- Vite (5173): `curl --connect-timeout 2 -s http://localhost:5173`
- ComfyUI (8188): `curl --connect-timeout 2 -s http://localhost:8188/system_stats`
- Image-gen (8420): `curl --connect-timeout 2 -s http://localhost:8420/health`

**Quick status check:**
```bash
for port in 5173 8188 8420; do
  nc -z localhost $port 2>/dev/null && echo "Port $port: UP" || echo "Port $port: DOWN"
done
```
""",
                }
            )
        )
        return

    if timeout > MAX_TIMEOUT:
        # BLOCK: Timeout too long
        print(
            json.dumps(
                {
                    "decision": "block",
                    "reason": f"""🚫 CURL TIMEOUT TOO LONG ({timeout}s > {MAX_TIMEOUT}s max)

Long timeouts defeat the purpose. Use shorter timeout:
`curl --connect-timeout 2 -m {DEFAULT_TIMEOUT} ...`

If server might be slow to respond, check it's running first:
`pgrep -f "pattern" && curl ...`
""",
                }
            )
        )
        return

    # Approved with timeout
    print(json.dumps({"decision": "approve"}))


if __name__ == "__main__":
    main()
