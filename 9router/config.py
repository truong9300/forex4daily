import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

CONFIG_FILE = Path(__file__).parent / "router_config.json"

DEFAULT_CONFIG = {
    "active_provider": "claude",
    "providers": {
        "claude": {
            "name": "Anthropic Claude",
            "api_key": "",
            "model": "claude-opus-4-8",
            "base_url": "https://api.anthropic.com",
            "enabled": True
        },
        "openai": {
            "name": "OpenAI ChatGPT",
            "api_key": "",
            "model": "gpt-4o",
            "base_url": "https://api.openai.com/v1",
            "enabled": True
        },
        "deepseek": {
            "name": "DeepSeek",
            "api_key": "",
            "model": "deepseek-chat",
            "base_url": "https://api.deepseek.com/v1",
            "enabled": True
        },
        "openrouter": {
            "name": "OpenRouter",
            "api_key": "",
            "model": "anthropic/claude-opus-4-8",
            "base_url": "https://openrouter.ai/api/v1",
            "enabled": True
        },
        "gemini": {
            "name": "Google Gemini",
            "api_key": "",
            "model": "gemini-2.0-flash",
            "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
            "enabled": True
        },
        "nvidia": {
            "name": "NVIDIA NIM",
            "api_key": "",
            "model": "meta/llama-3.1-70b-instruct",
            "base_url": "https://integrate.api.nvidia.com/v1",
            "enabled": True
        },
        "groq": {
            "name": "Groq",
            "api_key": "",
            "model": "llama-3.1-70b-versatile",
            "base_url": "https://api.groq.com/openai/v1",
            "enabled": True
        },
        "mistral": {
            "name": "Mistral AI",
            "api_key": "",
            "model": "mistral-large-latest",
            "base_url": "https://api.mistral.ai/v1",
            "enabled": True
        },
        "together": {
            "name": "Together AI",
            "api_key": "",
            "model": "meta-llama/Llama-3-70b-chat-hf",
            "base_url": "https://api.together.xyz/v1",
            "enabled": True
        }
    }
}


def load_config() -> dict:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            stored = json.load(f)
        # Merge with defaults so new providers appear
        config = DEFAULT_CONFIG.copy()
        config["active_provider"] = stored.get("active_provider", config["active_provider"])
        for provider, data in stored.get("providers", {}).items():
            if provider in config["providers"]:
                config["providers"][provider].update(data)
            else:
                config["providers"][provider] = data
        return config

    # Bootstrap from env vars
    config = json.loads(json.dumps(DEFAULT_CONFIG))
    env_map = {
        "claude": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "nvidia": "NVIDIA_API_KEY",
        "groq": "GROQ_API_KEY",
        "mistral": "MISTRAL_API_KEY",
        "together": "TOGETHER_API_KEY",
    }
    for provider, env_var in env_map.items():
        val = os.getenv(env_var, "")
        if val:
            config["providers"][provider]["api_key"] = val

    if os.getenv("ACTIVE_PROVIDER"):
        config["active_provider"] = os.getenv("ACTIVE_PROVIDER")

    save_config(config)
    return config


def save_config(config: dict):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)


def get_active_provider(config: dict) -> dict:
    name = config["active_provider"]
    provider = config["providers"].get(name)
    if not provider:
        raise ValueError(f"Provider '{name}' not found in config")
    return {"id": name, **provider}
