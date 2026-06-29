# Task List: [FEATURE_NAME]

**Branch**: `[###-feature-name]` | **Date**: [DATE]
**Plan**: `specs/[###-feature-name]/plan.md`
**Spec**: `specs/[###-feature-name]/spec.md`

---

> **IMPORTANT**: Sample tasks below are for illustration only.
> Replace ALL tasks with actual tasks derived from your spec/plan documents.
> DO NOT keep these sample tasks in the final tasks.md file.

## Task Format

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

- `[P]` = parallelizable (no dependency on incomplete tasks, different files)
- `[US1]`, `[US2]`, etc. = maps to user story from spec.md
- Setup/Foundation phases: NO story label
- User Story phases: MUST have story label

## Phase 1: Setup

> Project initialization — MUST complete before anything else.

- [ ] T001 Initialize project structure per implementation plan
- [ ] T002 Install and configure dependencies
- [ ] T003 Set up development environment and tooling

## Phase 2: Foundation

> Blocking prerequisites for all user stories — MUST complete before user stories.

- [ ] T004 Create core type definitions in `src/types/index.ts`
- [ ] T005 [P] Set up database schema / data layer
- [ ] T006 [P] Configure testing infrastructure

## Phase 3: User Story 1 — [US1 Name]

**Story Goal**: [What US1 delivers]

**Independent Test Criteria**: [How to verify US1 works in isolation]

- [ ] T007 [US1] Implement [Entity] model in `src/models/[entity].ts`
- [ ] T008 [P] [US1] Create [Service] in `src/services/[service].ts`
- [ ] T009 [US1] Add [Component/Endpoint] in `src/[path]/[file].ts`
- [ ] T010 [US1] Write integration tests in `tests/integration/[feature].test.ts`

## Phase 4: User Story 2 — [US2 Name]

**Story Goal**: [What US2 delivers]

**Independent Test Criteria**: [How to verify US2 works in isolation]

- [ ] T011 [US2] Implement [Entity 2] model in `src/models/[entity2].ts`
- [ ] T012 [P] [US2] Create [Service 2] in `src/services/[service2].ts`
- [ ] T013 [US2] Add [Component/Endpoint 2] in `src/[path]/[file2].ts`
- [ ] T014 [US2] Write integration tests in `tests/integration/[feature2].test.ts`

## Final Phase: Polish & Cross-Cutting Concerns

> Improvements that affect multiple user stories.

- [ ] T015 [P] Add error handling and edge cases across all modules
- [ ] T016 [P] Add performance optimizations identified in plan
- [ ] T017 Write unit tests for core business logic
- [ ] T018 Update README and documentation

---

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1) → Phase 4 (US2) → Polish
                                        ↗
                  Phase 2 (Foundation) →
```

Most user stories are independent once Phase 2 is complete.

## Parallel Execution Examples

**Per User Story** (within a story phase, tasks marked [P] can run in parallel):
```
T007 (model) → T008 [P] (service) + T009 [P] (component) → T010 (integration test)
```

## Implementation Strategy

**MVP First**: Complete Phase 1 + Phase 2 + Phase 3 (US1 only) for minimal viable delivery.

**Incremental**: Add each user story sequentially after MVP is validated.

**Parallel Team**: Multiple developers can take different user story phases simultaneously after Foundation phase.

---

## Completion Checklist

- [ ] All tasks follow the checklist format (checkbox, ID, labels, file paths)
- [ ] Each user story has independent test criteria
- [ ] Dependencies accurately reflect execution order
- [ ] MVP scope identified
- [ ] Parallel opportunities marked with [P]
