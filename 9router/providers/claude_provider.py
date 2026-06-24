import json
import time
import uuid
from typing import AsyncIterator

import anthropic

from .base import BaseProvider


def _messages_to_anthropic(messages: list[dict]) -> tuple[str | None, list[dict]]:
    """Extract system prompt and convert OpenAI messages to Anthropic format."""
    system = None
    converted = []
    for m in messages:
        role = m["role"]
        content = m.get("content", "")
        if role == "system":
            system = content
        elif role in ("user", "assistant"):
            converted.append({"role": role, "content": content})
    return system, converted


def _anthropic_to_openai(response: anthropic.types.Message, model: str) -> dict:
    """Convert Anthropic response to OpenAI chat completion format."""
    content = ""
    for block in response.content:
        if block.type == "text":
            content += block.text

    finish_reason_map = {
        "end_turn": "stop",
        "max_tokens": "length",
        "stop_sequence": "stop",
        "tool_use": "tool_calls",
    }

    return {
        "id": f"chatcmpl-{response.id}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": finish_reason_map.get(response.stop_reason, "stop"),
            }
        ],
        "usage": {
            "prompt_tokens": response.usage.input_tokens,
            "completion_tokens": response.usage.output_tokens,
            "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
        },
    }


class ClaudeProvider(BaseProvider):

    def __init__(self, config: dict):
        super().__init__(config)
        self._client = anthropic.AsyncAnthropic(api_key=self.api_key)

    async def chat_completions(self, payload: dict) -> dict:
        messages = payload.get("messages", [])
        system, converted = _messages_to_anthropic(messages)

        kwargs = {
            "model": payload.get("model") or self.model,
            "max_tokens": payload.get("max_tokens") or 8192,
            "messages": converted,
        }
        if system:
            kwargs["system"] = system
        if payload.get("temperature") is not None:
            kwargs["temperature"] = payload["temperature"]
        if payload.get("stop"):
            kwargs["stop_sequences"] = (
                payload["stop"] if isinstance(payload["stop"], list) else [payload["stop"]]
            )

        response = await self._client.messages.create(**kwargs)
        return _anthropic_to_openai(response, kwargs["model"])

    async def chat_completions_stream(self, payload: dict) -> AsyncIterator[str]:
        messages = payload.get("messages", [])
        system, converted = _messages_to_anthropic(messages)
        model = payload.get("model") or self.model
        cid = f"chatcmpl-{uuid.uuid4().hex[:24]}"

        kwargs = {
            "model": model,
            "max_tokens": payload.get("max_tokens") or 8192,
            "messages": converted,
        }
        if system:
            kwargs["system"] = system
        if payload.get("temperature") is not None:
            kwargs["temperature"] = payload["temperature"]

        async with self._client.messages.stream(**kwargs) as stream:
            # Send role chunk first
            chunk = {
                "id": cid,
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": model,
                "choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}, "finish_reason": None}],
            }
            yield f"data: {json.dumps(chunk)}\n\n"

            async for text in stream.text_stream:
                chunk = {
                    "id": cid,
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": model,
                    "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": None}],
                }
                yield f"data: {json.dumps(chunk)}\n\n"

            # Final chunk
            chunk = {
                "id": cid,
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": model,
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"
