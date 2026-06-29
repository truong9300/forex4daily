---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

- Find the active feature directory under `specs/`
- Verify `specs/[###-feature-name]/tasks.md` exists — if not, instruct user to run `/speckit.tasks` first
- Verify `specs/[###-feature-name]/plan.md` exists

## Outline

1. **Check Checklists** (if `specs/[###-feature-name]/checklists/` exists):
   - Scan all checklist files
   - Count completed vs incomplete items
   - If any incomplete: show status table and ask user to confirm before proceeding

2. **Load Implementation Context**:
   - **REQUIRED**: `tasks.md` for complete task list and execution plan
   - **REQUIRED**: `plan.md` for tech stack, architecture, and file structure
   - **IF EXISTS**: `data-model.md` for entities and relationships
   - **IF EXISTS**: `contracts/` for API specifications
   - **IF EXISTS**: `research.md` for technical decisions
   - **IF EXISTS**: `.specify/memory/constitution.md` for governance constraints
   - **IF EXISTS**: `quickstart.md` for integration scenarios

3. **Project Setup Verification**:
   - Verify/create `.gitignore` with technology-appropriate patterns
   - Check for and create other ignore files as appropriate (`.eslintignore`, etc.)

4. **Parse Task Structure**:
   - Extract task phases (Setup → Foundation → User Stories → Polish)
   - Identify sequential vs parallel tasks
   - Map file paths and dependencies

5. **Execute Implementation**:
   - **Phase-by-phase**: Complete each phase before moving to next
   - **Respect dependencies**: Sequential tasks in order, parallel tasks `[P]` together
   - **TDD approach**: Test tasks before corresponding implementation tasks (if tests requested)
   - **File-based coordination**: Tasks affecting same files must run sequentially
   - Mark each completed task as `[X]` in tasks.md

6. **Progress Tracking**:
   - Report progress after each completed task
   - Halt on non-parallel task failure
   - For parallel tasks `[P]`: continue successful, report failed
   - Suggest next steps if implementation cannot proceed

7. **Completion Validation**:
   - Verify all required tasks completed
   - Check implementation matches original specification
   - Validate tests pass

## Completion Report

- Summary of completed work by phase
- Tasks completed: [count]
- Any failed or skipped tasks
- Next steps for the user

## Done When

- [ ] All tasks in tasks.md completed and marked `[X]`
- [ ] Implementation validated against specification and plan
- [ ] Completion reported to user with summary
