#!/bin/sh
# UserPromptSubmit hook - remind to use Serena MCP tools

cat << 'EOF'
{
  "result": "continue",
  "message": "💡 **Serena MCP**: Use symbolic tools (`find_symbol`, `get_symbols_overview`, `search_for_pattern`) instead of raw grep/read for code exploration. Check `list_memories` for project context."
}
EOF
