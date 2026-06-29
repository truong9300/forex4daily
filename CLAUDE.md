# forex4daily — Claude Code Instructions

<!-- SPECKIT START -->

## Spec-Driven Development

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit) for Spec-Driven Development.

**Always check `specs/` for existing specifications before implementing any feature.**

### Quick Commands

- `/speckit.specify <feature description>` — Create a new feature spec
- `/speckit.plan <technical notes>` — Generate implementation plan
- `/speckit.tasks` — Generate executable task list
- `/speckit.analyze` — Check consistency before implementing
- `/speckit.implement` — Execute the task list

### Constitution

Project governance principles are in `.specify/memory/constitution.md`. All changes must comply.

<!-- SPECKIT END -->

## Project Overview

forex4daily is a web application built with React/TypeScript and Vite, deployed on Firebase.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Deployment**: Firebase Hosting
- **AI Features**: TensorFlow.js, HuggingFace Transformers.js

## Development

```bash
npm install
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Key Files

- `src/` — Source code
- `public/` — Static assets
- `index.html` — Entry point
- `vite.config.ts` — Vite configuration
- `firebase.json` — Firebase configuration
