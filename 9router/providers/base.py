from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseProvider(ABC):

    def __init__(self, config: dict):
        self.config = config
        self.api_key = config.get("api_key", "")
        self.model = config.get("model", "")
        self.base_url = config.get("base_url", "")

    @abstractmethod
    async def chat_completions(self, payload: dict) -> dict:
        """Non-streaming chat completion."""
        ...

    @abstractmethod
    async def chat_completions_stream(self, payload: dict) -> AsyncIterator[str]:
        """Streaming chat completion — yields raw SSE lines (strings)."""
        ...
