---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

- Find the active feature directory under `specs/`
- Verify `specs/[###-feature-name]/plan.md` exists — if not, instruct user to run `/speckit.plan` first
- Load `specs/[###-feature-name]/spec.md` for user stories

## Outline

1. **Setup**: Identify FEATURE_DIR. Load all available design documents.

2. **Load Design Documents**:
   - **Required**: `plan.md` (tech stack, libraries, structure), `spec.md` (user stories with priorities)
   - **Optional**: `data-model.md` (entities), `contracts/` (interface contracts), `research.md` (decisions), `quickstart.md` (test scenarios)
   - **IF EXISTS**: Load `.specify/memory/constitution.md` for governance constraints

3. **Generate Task Breakdown**:
   - Extract tech stack and project structure from `plan.md`
   - Extract user stories with priorities (P1, P2, P3) from `spec.md`
   - Map entities from `data-model.md` to user stories
   - Map interface contracts to user stories
   - Generate tasks organized by user story

4. **Generate `tasks.md`**: Use `.specify/templates/tasks-template.md` as structure. Fill with:
   - **Phase 1**: Setup tasks (project initialization)
   - **Phase 2**: Foundational tasks (blocking prerequisites for all user stories)
   - **Phase 3+**: One phase per user story in priority order (P1, P2, P3...)
   - **Final Phase**: Polish & cross-cutting concerns

## Task Format (REQUIRED)

Every task MUST follow this exact format:

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:
1. **Checkbox**: ALWAYS start with `- [ ]`
2. **Task ID**: Sequential (T001, T002, T003...)
3. **[P] marker**: ONLY if parallelizable (different files, no incomplete dependencies)
4. **[Story] label**: `[US1]`, `[US2]`, etc. — REQUIRED for user story phases only
5. **Description**: Clear action with exact file path

**Examples**:
- ✅ `- [ ] T001 Create project structure per implementation plan`
- ✅ `- [ ] T005 [P] Implement middleware in src/middleware/auth.ts`
- ✅ `- [ ] T012 [P] [US1] Create User model in src/models/user.ts`
- ❌ `- [ ] Create User model` (missing ID and story label)
- ❌ `T001 [US1] Create model` (missing checkbox)

## Completion Report

- Output: `specs/[###-feature-name]/tasks.md`
- Total task count
- Task count per user story
- Parallel opportunities identified
- MVP scope (typically Phase 1 + Phase 2 + Phase 3 only)
- Next step: Run `/speckit.analyze` for consistency check, then `/speckit.implement`

## Done When

- [ ] `tasks.md` generated with all phases, task IDs, story labels, and file paths
- [ ] All tasks follow the checklist format
- [ ] Dependencies section shows story completion order
- [ ] MVP scope identified
- [ ] Completion reported to user
