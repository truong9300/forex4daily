#!/usr/bin/env python3
"""Menu-driven LLM configuration app for OpenClaw (Claude Code)."""

import json
import os
import sys
from pathlib import Path

import questionary
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()

# Claude settings file locations (in priority order)
SETTINGS_PATHS = [
    Path.home() / ".claude" / "settings.json",
    Path("/root/.claude/settings.json"),
    Path("/home/claude/.claude/settings.json"),
]

MODELS = {
    "claude-opus-4-8": {
        "name": "Claude Opus 4.8",
        "context": "1M tokens",
        "cost": "$5.00/$25.00 per 1M",
        "notes": "Most capable (recommended)",
    },
    "claude-fable-5": {
        "name": "Claude Fable 5",
        "context": "1M tokens",
        "cost": "$10.00/$50.00 per 1M",
        "notes": "Highest capability, highest cost",
    },
    "claude-sonnet-4-6": {
        "name": "Claude Sonnet 4.6",
        "context": "1M tokens",
        "cost": "$3.00/$15.00 per 1M",
        "notes": "Balanced speed and quality",
    },
    "claude-haiku-4-5": {
        "name": "Claude Haiku 4.5",
        "context": "200K tokens",
        "cost": "$1.00/$5.00 per 1M",
        "notes": "Fastest, most affordable",
    },
}

EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"]
THINKING_TYPES = ["adaptive", "disabled"]


def find_settings_file() -> Path | None:
    for path in SETTINGS_PATHS:
        if path.exists():
            return path
    # Return the first writable location
    for path in SETTINGS_PATHS:
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            return path
        except PermissionError:
            continue
    return None


def load_settings(path: Path) -> dict:
    if path.exists():
        try:
            with open(path) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_settings(path: Path, settings: dict) -> bool:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(settings, f, indent=4)
        return True
    except IOError as e:
        console.print(f"[red]Error saving settings: {e}[/red]")
        return False


def get_llm_config(settings: dict) -> dict:
    return settings.get("llmConfig", {})


def set_llm_config(settings: dict, llm_config: dict) -> dict:
    settings["llmConfig"] = llm_config
    return settings


def show_current_config(settings: dict, settings_path: Path):
    llm = get_llm_config(settings)

    table = Table(title="Current LLM Configuration", box=box.ROUNDED, show_header=True)
    table.add_column("Setting", style="cyan", width=20)
    table.add_column("Value", style="green")

    table.add_row("Config file", str(settings_path))
    table.add_row("Model", llm.get("model", "[not set]"))
    table.add_row("Max tokens", str(llm.get("maxTokens", "[not set]")))
    table.add_row("Thinking", llm.get("thinking", "[not set]"))
    table.add_row("Effort", llm.get("effort", "[not set]"))
    table.add_row("API Key", "***" + llm.get("apiKey", "")[-4:] if llm.get("apiKey") else "[not set / env var]")

    console.print(table)


def menu_select_model(current: str | None) -> str | None:
    choices = []
    for model_id, info in MODELS.items():
        label = f"{info['name']} ({model_id}) — {info['notes']}"
        choices.append(questionary.Choice(title=label, value=model_id))
    choices.append(questionary.Choice(title="[Custom model ID]", value="__custom__"))
    choices.append(questionary.Choice(title="[Keep current]", value="__keep__"))

    result = questionary.select(
        "Select Claude model:",
        choices=choices,
        default=current or "claude-opus-4-8",
    ).ask()

    if result == "__keep__":
        return current
    if result == "__custom__":
        return questionary.text("Enter model ID:").ask()
    return result


def menu_set_max_tokens(current: int | None) -> int | None:
    default = str(current) if current else "16000"
    raw = questionary.text(
        f"Max tokens (current: {current or 'not set'}, press Enter to keep):",
        default=default,
    ).ask()
    if raw is None or raw.strip() == "":
        return current
    try:
        return int(raw.strip())
    except ValueError:
        console.print("[yellow]Invalid number, keeping current value.[/yellow]")
        return current


def menu_set_thinking(current: str | None) -> str | None:
    choices = [questionary.Choice(title=t, value=t) for t in THINKING_TYPES]
    choices.append(questionary.Choice(title="[Keep current]", value="__keep__"))

    result = questionary.select(
        f"Thinking mode (current: {current or 'not set'}):",
        choices=choices,
        default=current if current in THINKING_TYPES else "adaptive",
    ).ask()

    if result == "__keep__":
        return current
    return result


def menu_set_effort(current: str | None) -> str | None:
    choices = [questionary.Choice(title=e, value=e) for e in EFFORT_LEVELS]
    choices.append(questionary.Choice(title="[Keep current / not set]", value="__keep__"))

    result = questionary.select(
        f"Effort level (current: {current or 'not set'}) — only applies to Fable 5:",
        choices=choices,
        default=current if current in EFFORT_LEVELS else "__keep__",
    ).ask()

    if result == "__keep__":
        return current
    return result


def menu_set_api_key(current: str | None) -> str | None:
    env_key = os.environ.get("ANTHROPIC_API_KEY")
    hint = " (ANTHROPIC_API_KEY env var is set)" if env_key else ""
    console.print(f"[dim]Note: API key can be set via ANTHROPIC_API_KEY env var{hint}[/dim]")

    action = questionary.select(
        "API key:",
        choices=[
            questionary.Choice("Use ANTHROPIC_API_KEY env variable (recommended)", "env"),
            questionary.Choice("Enter API key manually", "manual"),
            questionary.Choice("[Keep current]", "keep"),
        ],
    ).ask()

    if action == "keep":
        return current
    if action == "env":
        return None  # remove from config, rely on env
    if action == "manual":
        key = questionary.password("Enter Anthropic API key (sk-ant-...):").ask()
        return key.strip() if key else current
    return current


def show_model_info():
    table = Table(title="Available Claude Models", box=box.ROUNDED)
    table.add_column("Model ID", style="cyan")
    table.add_column("Name", style="bold")
    table.add_column("Context", style="green")
    table.add_column("Price (in/out per 1M)", style="yellow")
    table.add_column("Notes")

    for model_id, info in MODELS.items():
        table.add_row(model_id, info["name"], info["context"], info["cost"], info["notes"])

    console.print(table)


def quick_preset(settings: dict) -> dict:
    preset = questionary.select(
        "Select a preset configuration:",
        choices=[
            questionary.Choice("Performance — Opus 4.8 + adaptive thinking (default)", "performance"),
            questionary.Choice("Balanced — Sonnet 4.6 + adaptive thinking", "balanced"),
            questionary.Choice("Economy — Haiku 4.5, fast responses", "economy"),
            questionary.Choice("Maximum — Fable 5 + max effort", "maximum"),
        ],
    ).ask()

    presets = {
        "performance": {"model": "claude-opus-4-8", "thinking": "adaptive", "maxTokens": 16000},
        "balanced": {"model": "claude-sonnet-4-6", "thinking": "adaptive", "maxTokens": 8000},
        "economy": {"model": "claude-haiku-4-5", "thinking": "disabled", "maxTokens": 4000},
        "maximum": {"model": "claude-fable-5", "thinking": "adaptive", "effort": "max", "maxTokens": 32000},
    }

    if preset:
        llm = get_llm_config(settings)
        llm.update(presets[preset])
        settings = set_llm_config(settings, llm)
        console.print(f"[green]Applied '{preset}' preset.[/green]")

    return settings


def reset_config(settings: dict) -> dict:
    confirm = questionary.confirm("Reset all LLM config to defaults?", default=False).ask()
    if confirm:
        settings.pop("llmConfig", None)
        console.print("[yellow]LLM configuration reset.[/yellow]")
    return settings


def main():
    console.print(Panel.fit(
        "[bold cyan]OpenClaw LLM Configuration[/bold cyan]\n"
        "[dim]Configure Claude LLM settings for Claude Code (OpenClaw)[/dim]",
        border_style="cyan",
    ))

    settings_path = find_settings_file()
    if not settings_path:
        console.print("[red]Could not find or create settings file.[/red]")
        sys.exit(1)

    settings = load_settings(settings_path)

    while True:
        console.print()
        show_current_config(settings, settings_path)
        console.print()

        action = questionary.select(
            "What would you like to do?",
            choices=[
                questionary.Choice("Apply preset configuration", "preset"),
                questionary.Choice("Change model", "model"),
                questionary.Choice("Set max tokens", "tokens"),
                questionary.Choice("Set thinking mode", "thinking"),
                questionary.Choice("Set effort level (Fable 5 only)", "effort"),
                questionary.Choice("Set API key", "apikey"),
                questionary.Choice("Show model info", "modelinfo"),
                questionary.Choice("Save and exit", "save"),
                questionary.Choice("Exit without saving", "exit"),
                questionary.Choice("Reset LLM config", "reset"),
            ],
        ).ask()

        if action is None or action == "exit":
            console.print("[yellow]Exiting without saving.[/yellow]")
            break

        llm = get_llm_config(settings)

        if action == "preset":
            settings = quick_preset(settings)

        elif action == "model":
            new_model = menu_select_model(llm.get("model"))
            if new_model:
                llm["model"] = new_model
            settings = set_llm_config(settings, llm)

        elif action == "tokens":
            new_tokens = menu_set_max_tokens(llm.get("maxTokens"))
            if new_tokens is not None:
                llm["maxTokens"] = new_tokens
            settings = set_llm_config(settings, llm)

        elif action == "thinking":
            new_thinking = menu_set_thinking(llm.get("thinking"))
            if new_thinking is not None:
                llm["thinking"] = new_thinking
            settings = set_llm_config(settings, llm)

        elif action == "effort":
            new_effort = menu_set_effort(llm.get("effort"))
            if new_effort is not None:
                llm["effort"] = new_effort
            elif "effort" in llm and new_effort is None:
                llm.pop("effort", None)
            settings = set_llm_config(settings, llm)

        elif action == "apikey":
            new_key = menu_set_api_key(llm.get("apiKey"))
            if new_key is None:
                llm.pop("apiKey", None)
            elif new_key:
                llm["apiKey"] = new_key
            settings = set_llm_config(settings, llm)

        elif action == "modelinfo":
            show_model_info()

        elif action == "reset":
            settings = reset_config(settings)

        elif action == "save":
            if save_settings(settings_path, settings):
                console.print(f"[green]Configuration saved to {settings_path}[/green]")
            break

    console.print("[dim]Done.[/dim]")


if __name__ == "__main__":
    main()
