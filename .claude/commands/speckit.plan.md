---
description: Create a comprehensive implementation plan from a feature specification
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

- Verify `specs/` directory exists with at least one feature folder
- Find the active feature directory (most recently modified, or ask user if multiple exist)
- Verify `specs/[###-feature-name]/spec.md` exists — if not, instruct user to run `/speckit.specify` first
- Check `.specify/memory/constitution.md` exists and load it

## Outline

1. **Setup**: Identify FEATURE_DIR from active feature spec. All paths must be absolute.

2. **Load Context**:
   - Read `specs/[###-feature-name]/spec.md` for requirements and user stories
   - Read `.specify/memory/constitution.md` for architectural principles
   - Consider any additional context from user input ($ARGUMENTS)

3. **Constitution Check (GATE)**:
   - Evaluate the planned approach against all constitution principles
   - Document any potential violations in the Complexity Tracking section
   - STOP if critical constitution violations cannot be justified

4. **Phase 0 — Research**:
   - Analyze spec requirements to determine tech stack choices
   - Identify library options and make decisions with rationale
   - Note all `[NEEDS CLARIFICATION]` items from spec and resolve or document
   - Produce `specs/[###-feature-name]/research.md`

5. **Phase 1 — Design**:
   - **Data Model**: Create `specs/[###-feature-name]/data-model.md` with entity definitions
   - **Interface Contracts**: Create `specs/[###-feature-name]/contracts/` with API specifications
   - **Quickstart**: Create `specs/[###-feature-name]/quickstart.md` with key validation scenarios
   - **Plan**: Fill `specs/[###-feature-name]/plan.md` using `.specify/templates/plan-template.md`

6. **Validation**: Ensure all artifacts are consistent and complete

## Artifacts Generated

```text
specs/[###-feature-name]/
├── plan.md          ← Main implementation plan
├── research.md      ← Technical decisions and findings
├── data-model.md    ← Entity definitions and relationships
├── quickstart.md    ← Key validation scenarios
└── contracts/       ← API/interface specifications
    ├── api.md
    └── events.md
```

## Completion Report

- Plan location: `specs/[###-feature-name]/plan.md`
- Research: `specs/[###-feature-name]/research.md`
- Artifacts created: [list]
- Constitution check: [PASS/violations documented]
- Next step: Run `/speckit.tasks` to generate executable task list

## Done When

- [ ] `plan.md` created from template with all sections populated
- [ ] `research.md` created with technical decisions
- [ ] `data-model.md` created (if applicable)
- [ ] `contracts/` created with interface specifications
- [ ] `quickstart.md` created with validation scenarios
- [ ] Constitution check completed
- [ ] User notified with artifact locations and next steps
