# Spec Kit — Agent Instructions

<!-- SPECKIT START -->

## About This Project

This project uses **Spec-Driven Development (SDD)** via [GitHub Spec Kit](https://github.com/github/spec-kit).

Specifications are the source of truth. Code serves specifications — not the other way around.

## Spec Kit Commands

Use these slash commands to drive development:

| Command | Purpose |
|---------|---------|
| `/speckit.constitution` | Create/update project governance principles |
| `/speckit.specify` | Create a feature specification from a description |
| `/speckit.plan` | Generate a technical implementation plan from spec |
| `/speckit.tasks` | Generate an executable task list from plan |
| `/speckit.analyze` | Check consistency across spec/plan/tasks |
| `/speckit.implement` | Execute the implementation plan task by task |

## Workflow

```
idea → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.analyze → /speckit.implement
```

## Project Structure

```
.specify/
├── memory/
│   └── constitution.md    # Project governance principles (binding)
└── templates/
    ├── spec-template.md   # Feature specification template
    ├── plan-template.md   # Implementation plan template
    └── tasks-template.md  # Task list template

.claude/commands/           # Claude Code slash commands
├── speckit.specify.md
├── speckit.plan.md
├── speckit.tasks.md
├── speckit.analyze.md
├── speckit.implement.md
└── speckit.constitution.md

specs/                      # Feature specifications
└── [###-feature-name]/
    ├── spec.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md
    ├── contracts/
    └── tasks.md
```

## Core Principles

1. **Spec First**: Always create/update the spec before writing code
2. **Constitution is Binding**: All changes must align with `.specify/memory/constitution.md`
3. **Trace Everything**: Every task maps to a requirement; every requirement has a task
4. **Test-Driven**: Tests before implementation (when TDD is specified)
5. **Incremental**: Complete one user story fully before starting the next

<!-- SPECKIT END -->
