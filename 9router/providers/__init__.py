from .base import BaseProvider
from .claude_provider import ClaudeProvider
from .openai_compat import OpenAICompatProvider


def get_provider(provider_config: dict) -> BaseProvider:
    pid = provider_config["id"]
    if pid == "claude":
        return ClaudeProvider(provider_config)
    # All others use OpenAI-compatible REST
    return OpenAICompatProvider(provider_config)
