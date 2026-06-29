# Feature Specification: [FEATURE_NAME]

**Feature**: [###-feature-name]
**Date**: [DATE]
**Status**: Draft

---

## Overview

[Brief description of the feature and its purpose]

**Problem Statement**: [What problem does this solve?]

**User Value**: [What value does this deliver to users?]

---

## User Stories

> Each user story/journey must be independently testable and deployable independently.

### P1 — [Primary Story Name]

**As a** [user type],
**I want to** [action/goal],
**So that** [benefit/value].

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

### P2 — [Secondary Story Name]

**As a** [user type],
**I want to** [action/goal],
**So that** [benefit/value].

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Functional Requirements

> Focus on WHAT users need and WHY. Avoid HOW to implement (no tech stack, APIs, code structure).

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | [Requirement description] | P1 | [Notes or NEEDS CLARIFICATION] |
| FR-002 | [Requirement description] | P1 | |
| FR-003 | [Requirement description] | P2 | [NEEDS CLARIFICATION: specific question] |

---

## Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| NFR-001 | Performance | [Requirement] | [Measurable target] |
| NFR-002 | Security | [Requirement] | [Standard/compliance] |
| NFR-003 | Availability | [Requirement] | [Uptime target] |

---

## Success Criteria

> Measurable outcomes. Each criterion must be testable.

| ID | Criterion | Measurement | Target |
|----|-----------|-------------|--------|
| SC-001 | [Success criterion] | [How measured] | [Target value] |
| SC-002 | [Success criterion] | [How measured] | [Target value] |

---

## Edge Cases & Error Handling

- **[Edge case 1]**: [Expected behavior]
- **[Edge case 2]**: [Expected behavior]
- **[Error condition]**: [Expected response]

---

## Entities & Data

> Only include if the feature is data-heavy. Focus on what, not how.

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| [Entity 1] | [Description] | [attr1, attr2, ...] |

---

## Assumptions & Dependencies

**Assumptions**:
- [Assumption 1]
- [Assumption 2]

**Dependencies**:
- [Dependency 1]
- [Dependency 2]

**Out of Scope**:
- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

---

## Clarifications Needed

> Maximum 3 clarification questions. Ordered by impact: scope → security → UX → technical.

| # | Question | Impact if Unresolved |
|---|----------|---------------------|
| 1 | [Question] | [Impact description] |
| 2 | [Question] | [Impact description] |

---

## Requirements Checklist

- [ ] No implementation details (frameworks, languages, APIs) in requirements
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable and technology-agnostic
- [ ] All [NEEDS CLARIFICATION] markers resolved (max 3 remain)
- [ ] Each user story independently testable
- [ ] Edge cases identified
- [ ] Non-functional requirements have measurable targets
