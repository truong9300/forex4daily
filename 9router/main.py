"""
9Router — LLM API Proxy Switch
Exposes an OpenAI-compatible API and routes requests to any configured LLM provider.
"""

import json
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from config import get_active_provider, load_config, save_config
from providers import get_provider

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("9router")

_config: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _config
    _config = load_config()
    log.info("9Router started. Active provider: %s", _config["active_provider"])
    yield


app = FastAPI(title="9Router — LLM API Proxy Switch", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


# ─── OpenAI-Compatible Endpoints ────────────────────────────────────────────

@app.get("/v1/models")
async def list_models():
    provider_cfg = get_active_provider(_config)
    return {
        "object": "list",
        "data": [
            {
                "id": provider_cfg["model"],
                "object": "model",
                "created": 1677610602,
                "owned_by": provider_cfg["id"],
            }
        ],
    }


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    global _config
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    provider_cfg = get_active_provider(_config)
    provider = get_provider(provider_cfg)

    log.info(
        "Chat request → provider=%s model=%s stream=%s",
        provider_cfg["id"],
        payload.get("model") or provider_cfg["model"],
        payload.get("stream", False),
    )

    if payload.get("stream"):
        return StreamingResponse(
            provider.chat_completions_stream(payload),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        result = await provider.chat_completions(payload)
        return JSONResponse(result)
    except Exception as exc:
        log.exception("Provider error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Provider error: {exc}")


# ─── Management API ──────────────────────────────────────────────────────────

@app.get("/api/status")
async def get_status():
    provider_cfg = get_active_provider(_config)
    return {
        "active_provider": _config["active_provider"],
        "provider_name": provider_cfg["name"],
        "model": provider_cfg["model"],
        "providers": {
            k: {
                "name": v["name"],
                "model": v["model"],
                "enabled": v.get("enabled", True),
                "configured": bool(v.get("api_key")),
            }
            for k, v in _config["providers"].items()
        },
    }


@app.post("/api/switch/{provider_id}")
async def switch_provider(provider_id: str):
    global _config
    if provider_id not in _config["providers"]:
        raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' not found")

    _config["active_provider"] = provider_id
    save_config(_config)
    provider_cfg = get_active_provider(_config)
    log.info("Switched active provider to: %s", provider_id)
    return {"active_provider": provider_id, "name": provider_cfg["name"], "model": provider_cfg["model"]}


@app.get("/api/providers")
async def list_providers():
    return {
        k: {**v, "api_key": "***" if v.get("api_key") else ""}
        for k, v in _config["providers"].items()
    }


@app.put("/api/providers/{provider_id}")
async def update_provider(provider_id: str, request: Request):
    global _config
    if provider_id not in _config["providers"]:
        raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' not found")

    body = await request.json()
    allowed = {"api_key", "model", "base_url", "enabled"}
    for key in allowed:
        if key in body:
            _config["providers"][provider_id][key] = body[key]

    save_config(_config)
    return {"updated": provider_id}


# ─── Dashboard UI ────────────────────────────────────────────────────────────

@app.get("/")
async def dashboard(request: Request):
    provider_cfg = get_active_provider(_config)
    providers_display = {
        k: {**v, "api_key_set": bool(v.get("api_key"))}
        for k, v in _config["providers"].items()
    }
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "active_provider": _config["active_provider"],
            "active_name": provider_cfg["name"],
            "active_model": provider_cfg["model"],
            "providers": providers_display,
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)
