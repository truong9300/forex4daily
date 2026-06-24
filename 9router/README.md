# 9Router — LLM API Proxy Switch

A lightweight proxy that lets Claude Code (and any OpenAI-compatible client) route to **9 different LLM providers** via a single endpoint.

## Supported Providers

| ID | Provider | Notes |
|----|----------|-------|
| `claude` | Anthropic Claude | Native SDK |
| `openai` | OpenAI ChatGPT | OpenAI-compatible |
| `deepseek` | DeepSeek | OpenAI-compatible |
| `openrouter` | OpenRouter | Routes to 100+ models |
| `gemini` | Google Gemini | OpenAI-compatible endpoint |
| `nvidia` | NVIDIA NIM | OpenAI-compatible |
| `groq` | Groq | Ultra-fast inference |
| `mistral` | Mistral AI | OpenAI-compatible |
| `together` | Together AI | OpenAI-compatible |

## Quick Start

```bash
cd 9router
cp .env.example .env          # add your API keys
./start.sh                    # installs deps and starts on port 9000
```

Dashboard: http://localhost:9000

## Connect Claude Code

```bash
export ANTHROPIC_BASE_URL=http://localhost:9000
export ANTHROPIC_API_KEY=any-value
claude
```

Or add to `~/.bashrc` / `~/.zshrc` for persistence.

## Switch Provider

### Via Dashboard
Open http://localhost:9000 and click **Switch to this** on any provider card.

### Via API
```bash
curl -X POST http://localhost:9000/api/switch/openai
curl -X POST http://localhost:9000/api/switch/claude
curl -X POST http://localhost:9000/api/switch/deepseek
```

### Via CLI (one-liner)
```bash
# Instantly switch to DeepSeek
curl -sX POST http://localhost:9000/api/switch/deepseek | python3 -m json.tool
```

## Configure a Provider
```bash
curl -X PUT http://localhost:9000/api/providers/openai \
  -H "Content-Type: application/json" \
  -d '{"api_key":"sk-...","model":"gpt-4o"}'
```

## Status
```bash
curl http://localhost:9000/api/status
```

## Architecture

```
Claude Code / Any OpenAI client
          │
          ▼  (ANTHROPIC_BASE_URL or openai.base_url)
    9Router :9000
    ┌─────────────────────────────────────┐
    │  POST /v1/chat/completions          │
    │  GET  /v1/models                   │
    │  GET  /api/status                  │
    │  POST /api/switch/{provider}        │
    │  PUT  /api/providers/{provider}     │
    └──────────────┬──────────────────────┘
                   │ active_provider
          ┌────────┼────────────┐
          ▼        ▼            ▼
      Claude    OpenAI      DeepSeek
      Gemini    OpenRouter   NVIDIA
      Groq      Mistral     Together
```
