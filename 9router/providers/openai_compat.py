import json
from typing import AsyncIterator

import httpx

from .base import BaseProvider


class OpenAICompatProvider(BaseProvider):
    """Generic OpenAI-compatible provider (OpenAI, DeepSeek, OpenRouter, Gemini, NVIDIA, Groq, Mistral, Together)."""

    def _headers(self) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        # OpenRouter requires extra headers for rankings/attribution
        if "openrouter" in self.base_url:
            headers["HTTP-Referer"] = "https://github.com/forex4daily/9router"
            headers["X-Title"] = "9Router LLM Proxy"
        return headers

    def _build_payload(self, payload: dict) -> dict:
        body = dict(payload)
        # Use configured model if the caller didn't specify one
        if not body.get("model"):
            body["model"] = self.model
        return body

    async def chat_completions(self, payload: dict) -> dict:
        body = self._build_payload(payload)
        body.pop("stream", None)  # ensure non-streaming

        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=self._headers(),
                json=body,
            )
            r.raise_for_status()
            return r.json()

    async def chat_completions_stream(self, payload: dict) -> AsyncIterator[str]:
        body = self._build_payload(payload)
        body["stream"] = True

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=self._headers(),
                json=body,
            ) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if line:
                        yield line + "\n\n"
