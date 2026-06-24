#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — please fill in your API keys."
fi

if [ ! -d .venv ]; then
  echo "Creating virtual environment…"
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "  9Router starting on http://localhost:9000"
echo "  Dashboard: http://localhost:9000/"
echo "  OpenAI-compatible API: http://localhost:9000/v1"
echo ""
echo "  To use with Claude Code:"
echo "    export ANTHROPIC_BASE_URL=http://localhost:9000"
echo "    export ANTHROPIC_API_KEY=any-value"
echo "    claude"
echo ""

python main.py
