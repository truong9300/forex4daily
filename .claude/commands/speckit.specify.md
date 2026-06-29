---
description: Create a feature specification from a natural language description using Spec-Driven Development
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Generate Feature Name**: Create a 2-4 word short name capturing the feature essence from the user description. Use kebab-case.

2. **Resolve Feature Directory**:
   - Scan `specs/` directory to find existing feature folders
   - Determine the next sequential number (001, 002, 003..., expands beyond 3 digits if needed)
   - Create directory `specs/[###-feature-name]/`

3. **Create Specification**:
   - Copy `.specify/templates/spec-template.md` to `specs/[###-feature-name]/spec.md`
   - Populate all sections with concrete details from the user description
   - Replace all `[PLACEHOLDER]` tokens with actual content
   - Mark any unclear items as `[NEEDS CLARIFICATION: specific question]`

4. **Quality Validation**: Verify the generated spec:
   - No implementation details (no tech stack, APIs, code structure) — focus on WHAT and WHY
   - All requirements are testable and unambiguous
   - Success criteria are measurable and technology-agnostic
   - Maximum 3 clarification markers remain
   - Each user story independently testable

5. **Handle Clarifications**: If `[NEEDS CLARIFICATION]` markers exist:
   - Extract and present as structured table
   - Order by impact: scope → security → UX → technical details
   - Limit to top 3 most critical questions
   - Wait for user response before finalizing

6. **Branch Name**: Suggest a git branch name: `feat/[###-feature-name]`

## Completion Report

- Feature directory: `specs/[###-feature-name]/`
- Spec file: `specs/[###-feature-name]/spec.md`
- Checklist status: [PASS/NEEDS WORK]
- Next step: Run `/speckit.plan` with technical approach, or resolve clarifications first

## Done When

- [ ] `specs/[###-feature-name]/spec.md` created and populated
- [ ] No unexplained `[PLACEHOLDER]` tokens remain
- [ ] Checklist validated
- [ ] User notified with directory path and next steps
