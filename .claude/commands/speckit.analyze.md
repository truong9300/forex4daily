---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. Run ONLY after `/speckit.tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report only.

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable**. Constitution conflicts are automatically CRITICAL.

## Execution Steps

### 1. Initialize Analysis Context

- Find active FEATURE_DIR under `specs/`
- Derive absolute paths:
  - SPEC = FEATURE_DIR/spec.md
  - PLAN = FEATURE_DIR/plan.md
  - TASKS = FEATURE_DIR/tasks.md
- Abort with error if any required file is missing

### 2. Load Artifacts

**From spec.md**: Overview, Functional Requirements, Success Criteria, User Stories, Edge Cases

**From plan.md**: Architecture/stack choices, Data Model references, Phases, Technical constraints

**From tasks.md**: Task IDs, Descriptions, Phase grouping, Parallel markers [P], Referenced file paths

**From constitution**: `.specify/memory/constitution.md` for principle validation

### 3. Detection Passes

Focus on high-signal findings. Limit to 50 findings total.

#### A. Duplication Detection
- Near-duplicate requirements
- Redundant tasks

#### B. Ambiguity Detection
- Vague adjectives (fast, scalable, secure, intuitive) lacking measurable criteria
- Unresolved placeholders (TODO, TKTK, ???, `<placeholder>`)

#### C. Underspecification
- Requirements with verbs but missing object or measurable outcome
- Tasks referencing files not defined in spec/plan

#### D. Constitution Alignment
- Any requirement or plan element conflicting with a MUST principle
- Missing mandated quality gates

#### E. Coverage Gaps
- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Success Criteria requiring buildable work not reflected in tasks

#### F. Inconsistency
- Terminology drift (same concept named differently)
- Conflicting requirements
- Task ordering contradictions

### 4. Severity Assignment

- **CRITICAL**: Violates constitution MUST, missing core artifact, or requirement blocking baseline with zero coverage
- **HIGH**: Duplicate/conflicting requirement, ambiguous security/performance attribute, untestable criterion
- **MEDIUM**: Terminology drift, missing non-functional task coverage
- **LOW**: Style/wording improvements, minor redundancy

### 5. Analysis Report

Output Markdown report (no file writes):

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**
- Total Requirements:
- Total Tasks:
- Coverage %:
- Critical Issues:

### 6. Next Actions

- If CRITICAL issues: Recommend resolving before `/speckit.implement`
- If only LOW/MEDIUM: User may proceed with improvement suggestions
- Provide explicit command suggestions

### 7. Offer Remediation

Ask: "Would you like me to suggest concrete remediation edits for the top issues?" (Do NOT apply automatically.)

## Done When

- [ ] Analysis report generated (read-only, no file modifications)
- [ ] Severity assigned to each finding
- [ ] Coverage metrics calculated
- [ ] Next actions provided
- [ ] Remediation offer made
