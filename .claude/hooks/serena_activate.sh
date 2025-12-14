#!/bin/sh
# Serena auto-activation hook for pandemonium project
# Injects reminder to activate Serena MCP with this project

cat << 'EOF'
{
  "result": "continue",
  "message": "**Serena MCP**: Run `mcp__serena__activate_project(\"/home/jinx/projects/pandemonium\")` to enable symbolic code tools for this project."
}
EOF
