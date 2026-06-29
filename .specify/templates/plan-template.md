# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: [e.g., TypeScript 5.x, Python 3.11, or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., React, FastAPI, or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, localStorage, or N/A]

**Testing**: [e.g., Vitest, pytest, or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Web browser, Linux server, or NEEDS CLARIFICATION]

**Project Type**: [e.g., web-app/library/cli/service or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific targets or NEEDS CLARIFICATION]

**Constraints**: [e.g., <200ms p95, offline-capable, or NEEDS CLARIFICATION]

**Scale/Scope**: [e.g., 10k users, single-user app, or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Code quality & architecture discipline maintained (Principle I)
- [ ] Test-backed change plan established (Principle II)
- [ ] UX consistency maintained (Principle III)
- [ ] Performance & resource discipline considered (Principle IV)
- [ ] Minimal dependencies & safe file operations (Principle V)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── [feature-module]/
│   ├── index.ts
│   ├── types.ts
│   └── [sub-modules]
└── ...

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: [Document the selected structure]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., extra abstraction] | [current need] | [why simpler approach insufficient] |

## Phase 0: Research

### Technical Decisions

| Decision | Options Considered | Selected | Rationale |
|----------|-------------------|----------|-----------|
| [Decision area] | [Option A, Option B] | [Selected] | [Why] |

### Key Findings

- [Finding 1]
- [Finding 2]

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk] | Low/Med/High | Low/Med/High | [Mitigation] |

## Phase 1: Design

### Data Model

> See `data-model.md` for full entity definitions.

**Key Entities**: [List main entities]

**Relationships**: [Describe key relationships]

### API / Interface Contracts

> See `contracts/` for detailed specifications.

**Key Interfaces**:
- [Interface 1]: [Brief description]
- [Interface 2]: [Brief description]

### Quickstart Validation

> See `quickstart.md` for key validation scenarios.

**Happy Path**: [Brief description of primary flow]

## Implementation Phases

### Phase A: Foundation

**Goal**: [What gets established in this phase]

**Tasks**:
- [ ] Project setup and dependencies
- [ ] Core data model implementation
- [ ] Basic infrastructure

### Phase B: Core Features

**Goal**: [What gets implemented]

**Tasks**:
- [ ] Primary user story implementation
- [ ] API/interface implementation
- [ ] Integration with dependencies

### Phase C: Polish & Testing

**Goal**: [What gets finalized]

**Tasks**:
- [ ] Edge case handling
- [ ] Performance optimization
- [ ] Documentation

## Done When

- [ ] All phases complete
- [ ] Tests pass (unit, integration, contract)
- [ ] Performance targets met
- [ ] Documentation updated
