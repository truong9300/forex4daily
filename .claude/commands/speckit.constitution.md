---
description: Create or update the project constitution (.specify/memory/constitution.md) with concrete project principles
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Check Existing Constitution**:
   - If `.specify/memory/constitution.md` exists: read it, identify version and existing principles
   - If not exists: use `.specify/templates/` constitution template as base

2. **Collect Project Context**:
   - From user input ($ARGUMENTS): project name, domain, key principles
   - From repository: detect language/framework from package.json, pyproject.toml, etc.
   - From README.md: understand project purpose and constraints

3. **Replace All Placeholders**:
   - Replace `[PROJECT_NAME]` with actual project name
   - Replace `[PRINCIPLE_N_NAME]` and `[PRINCIPLE_N_DESCRIPTION]` with concrete principles
   - Replace `[DATE]` tokens with today's date (ISO format: YYYY-MM-DD)
   - No unexplained bracket tokens `[...]` may remain in final output

4. **Principles Quality Check**:
   - Each principle must be testable and declarative (not vague)
   - Must include rationale explaining WHY
   - Must have measurable compliance criteria
   - Cover: code quality, testing, UX, performance, dependencies

5. **Version Management**:
   - New constitution: version 1.0.0
   - Adding principle/section: MINOR bump (e.g., 1.0.0 → 1.1.0)
   - Breaking change/removal: MAJOR bump (e.g., 1.0.0 → 2.0.0)
   - Clarification only: PATCH bump (e.g., 1.0.0 → 1.0.1)

6. **Write Constitution**: Save to `.specify/memory/constitution.md`

7. **Propagate Changes**: Check if any dependent templates in `.specify/templates/` need updates to stay aligned

## Completion Report

- Constitution location: `.specify/memory/constitution.md`
- Version: [new version]
- Principles defined: [list]
- Version bump rationale: [why]
- Suggested commit message: `docs: ratify project constitution v[version]`

## Done When

- [ ] `.specify/memory/constitution.md` created/updated
- [ ] All placeholder tokens replaced
- [ ] Version bumped appropriately
- [ ] User notified with summary and suggested commit message
