# Tasks: Protocol Buffers VSCode Extension

**Input**: Design documents from `/specs/001-protobuf-vscode-extension/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This project follows TDD (Test-Driven Development) as mandated by the constitution. All tests must be written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow VSCode extension structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Node.js project with package.json including extension manifest
- [x] T002 [P] Install TypeScript 5.x and configure tsconfig.json per plan.md specifications
- [x] T003 [P] Install VSCode extension dependencies (vscode API 1.85+, protobufjs 7.x)
- [x] T004 [P] Install testing dependencies (Jest 29.x, @vscode/test-electron)
- [x] T005 [P] Create src/ directory structure (extension.ts, parser/, providers/, utils/, grammars/)
- [x] T006 [P] Create tests/ directory structure (unit/, integration/, fixtures/)
- [x] T007 [P] Configure Jest for unit testing in jest.config.js
- [x] T008 [P] Setup VSCode launch.json for debugging extension
- [x] T009 [P] Create .vscodeignore for extension packaging
- [x] T010 [P] Create sample .proto fixture files in tests/fixtures/ for testing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create TypeScript type definitions in src/types.ts for ProtoFile, MessageDefinition, Field, EnumDefinition per data-model.md
- [x] T012 Write unit tests for Debouncer in tests/unit/parser/debouncer.test.ts (TDD - write test first)
- [x] T013 Implement Debouncer class in src/parser/debouncer.ts with 300ms delay
- [x] T014 Write unit tests for SymbolTable in tests/unit/parser/symbolTable.test.ts (TDD - write test first)
- [x] T015 Implement SymbolTable class in src/parser/symbolTable.ts with file cache and lookup methods
- [x] T016 Write unit tests for ProtoParser in tests/unit/parser/protoParser.test.ts (TDD - write test first)
- [x] T017 Implement ProtoParser class in src/parser/protoParser.ts using protobufjs to parse .proto files
- [x] T018 Implement extension activation in src/extension.ts with language registration for 'proto'
- [x] T019 Write integration test for extension activation in tests/integration/extension.test.ts
- [x] T020 Create test utilities for VSCode API mocking in tests/utils/mockVscode.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Syntax Highlighting for Proto Files (Priority: P1) 🎯 MVP

**Goal**: Provide TextMate grammar for syntax highlighting of .proto files

**Independent Test**: Open a .proto file in VSCode and verify keywords, types, comments, and strings are displayed in different colors

### Implementation for User Story 1

- [x] T021 [P] [US1] Create TextMate grammar file syntaxes/proto.tmLanguage.json with keyword patterns (message, service, rpc, enum, import, package, option)
- [x] T022 [P] [US1] Add storage type patterns to grammar (string, int32, int64, bool, bytes, double, float, etc.)
- [x] T023 [P] [US1] Add comment patterns to grammar (single-line // and multi-line /* */)
- [x] T024 [P] [US1] Add string literal patterns to grammar
- [x] T025 [P] [US1] Add entity name patterns to grammar (message names, enum names, field names)
- [x] T026 [US1] Register grammar in package.json contributes.grammars section with language 'proto' and scopeName 'source.proto'
- [x] T027 [US1] Create language-configuration.json with brackets, comments, and indentation rules
- [x] T028 [US1] Ready for manual test: Launch Extension Development Host (F5) and verify highlighting with examples/test.proto

**Checkpoint**: At this point, User Story 1 should be fully functional - users can open .proto files with proper syntax highlighting

---

## Phase 4: User Story 2 - Code Completion for Proto Syntax (Priority: P2)

**Goal**: Provide IntelliSense code completion for proto keywords, types, and imports

**Independent Test**: Type partial keywords in .proto file and verify completion suggestions appear

### Tests for User Story 2 (TDD - write tests FIRST)

- [ ] T029 [P] [US2] Write unit tests for CompletionProvider in tests/unit/providers/completionProvider.test.ts covering keyword completion
- [ ] T030 [P] [US2] Write unit tests for import path completion in tests/unit/providers/completionProvider.test.ts
- [ ] T031 [US2] Write integration test for code completion in tests/integration/completion.test.ts

### Implementation for User Story 2

- [ ] T032 [P] [US2] Implement ProtoFinder utility in src/utils/protoFinder.ts to find .proto files in workspace (workspace root + proto/, protos/, src/proto/)
- [ ] T033 [P] [US2] Write unit tests for ProtoFinder in tests/unit/utils/protoFinder.test.ts
- [ ] T034 [US2] Implement CompletionProvider class in src/providers/completionProvider.ts with provideCompletionItems method
- [ ] T035 [US2] Add keyword completions (message, service, rpc, enum, import, package, option, etc.) to CompletionProvider
- [ ] T036 [US2] Add field type completions (string, int32, int64, bool, bytes, double, float, etc.) to CompletionProvider
- [ ] T037 [US2] Add option completions (deprecated, packed) to CompletionProvider
- [ ] T038 [US2] Add import path completions using ProtoFinder to suggest available .proto files
- [ ] T039 [US2] Register CompletionProvider in src/extension.ts activate() function
- [ ] T040 [US2] Verify performance: completion suggestions appear within 100ms benchmark

**Checkpoint**: At this point, User Story 2 should be independently functional - code completion works without needing navigation or diagnostics

---

## Phase 5: User Story 3 - Go to Definition Navigation (Priority: P3)

**Goal**: Navigate to message, enum, and service definitions within and across files

**Independent Test**: Right-click on a type reference and verify "Go to Definition" navigates to the correct location

### Tests for User Story 3 (TDD - write tests FIRST)

- [ ] T041 [P] [US3] Write unit tests for DefinitionProvider in tests/unit/providers/definitionProvider.test.ts for within-file navigation
- [ ] T042 [P] [US3] Write unit tests for PathResolver in tests/unit/utils/pathResolver.test.ts for import resolution
- [ ] T043 [US3] Write integration test for navigation in tests/integration/navigation.test.ts covering within-file and cross-file navigation

### Implementation for User Story 3

- [ ] T044 [P] [US3] Implement PathResolver utility in src/utils/pathResolver.ts to resolve import paths (workspace root + proto/, protos/, src/proto/)
- [ ] T045 [US3] Implement DefinitionProvider class in src/providers/definitionProvider.ts with provideDefinition method
- [ ] T046 [US3] Add within-file definition lookup using SymbolTable for message types in DefinitionProvider
- [ ] T047 [US3] Add within-file definition lookup for enum types in DefinitionProvider
- [ ] T048 [US3] Add within-file definition lookup for service types in DefinitionProvider
- [ ] T049 [US3] Add cross-file definition lookup using PathResolver for imported types in DefinitionProvider
- [ ] T050 [US3] Handle navigation errors gracefully when import cannot be resolved (show user-friendly message)
- [ ] T051 [US3] Register DefinitionProvider in src/extension.ts activate() function
- [ ] T052 [US3] Verify performance: navigation completes within 200ms for 95% of references

**Checkpoint**: All three user stories (P1-P3) should now work independently - users have syntax highlighting, completion, and navigation

---

## Phase 6: User Story 4 - Error Detection and Diagnostics (Priority: P4)

**Goal**: Detect and report syntax and semantic errors in real-time with debounced parsing

**Independent Test**: Introduce errors (missing semicolons, duplicate field numbers) and verify they are highlighted with error messages

### Tests for User Story 4 (TDD - write tests FIRST)

- [ ] T053 [P] [US4] Write unit tests for DiagnosticsProvider in tests/unit/providers/diagnosticsProvider.test.ts covering syntax error detection
- [ ] T054 [P] [US4] Write unit tests for semantic error detection (duplicate field numbers, undefined types) in tests/unit/providers/diagnosticsProvider.test.ts
- [ ] T055 [US4] Write integration test for error diagnostics in tests/integration/diagnostics.test.ts

### Implementation for User Story 4

- [ ] T056 [US4] Implement DiagnosticsProvider class in src/providers/diagnosticsProvider.ts with diagnostic collection
- [ ] T057 [US4] Integrate Debouncer with ProtoParser to trigger parsing 300ms after typing stops
- [ ] T058 [US4] Add syntax error detection using protobufjs parse errors in DiagnosticsProvider
- [ ] T059 [US4] Add semantic error detection for duplicate field numbers within messages in DiagnosticsProvider
- [ ] T060 [US4] Add semantic error detection for undefined types within current file in DiagnosticsProvider
- [ ] T061 [US4] Add semantic error detection for invalid field options in DiagnosticsProvider
- [ ] T062 [US4] Format error messages to be actionable (e.g., "Expected semicolon", "Duplicate field number 1")
- [ ] T063 [US4] Setup document change listener in src/extension.ts to trigger debounced parsing
- [ ] T064 [US4] Register diagnostic collection in src/extension.ts activate() function
- [ ] T065 [US4] Verify performance: errors displayed within 500ms after typing stops (300ms debounce + 200ms parsing)

**Checkpoint**: User Stories 1-4 all work independently - users have full development support except formatting

---

## Phase 7: User Story 5 - Format Document Support (Priority: P5)

**Goal**: Automatically format .proto files with consistent indentation (2 spaces) and spacing

**Independent Test**: Create poorly formatted .proto file, run "Format Document", verify consistent formatting

### Tests for User Story 5 (TDD - write tests FIRST)

- [ ] T066 [P] [US5] Write unit tests for FormattingProvider in tests/unit/providers/formattingProvider.test.ts covering indentation normalization
- [ ] T067 [P] [US5] Write unit tests for spacing normalization (around =, {}) in tests/unit/providers/formattingProvider.test.ts
- [ ] T068 [P] [US5] Write unit tests for idempotent formatting in tests/unit/providers/formattingProvider.test.ts

### Implementation for User Story 5

- [ ] T069 [US5] Implement FormattingProvider class in src/providers/formattingProvider.ts with provideDocumentFormattingEdits method
- [ ] T070 [US5] Implement indentation normalization (2 spaces per level) in FormattingProvider
- [ ] T071 [US5] Implement spacing normalization around equals signs and braces in FormattingProvider
- [ ] T072 [US5] Implement one-field-per-line formatting in FormattingProvider
- [ ] T073 [US5] Ensure formatting is idempotent (running twice produces no changes)
- [ ] T074 [US5] Preserve comments during formatting in FormattingProvider
- [ ] T075 [US5] Register FormattingProvider in src/extension.ts activate() function
- [ ] T076 [US5] Verify performance: formatting completes within 1 second for files up to 1000 lines

**Checkpoint**: All five user stories should now be independently functional - complete feature set delivered

---

## Phase 8: Hover Tooltips (Cross-Cutting Feature)

**Goal**: Show type information, field numbers, and documentation when hovering over proto elements

**Note**: This feature enhances all user stories but is not a standalone story

### Tests for Hover Tooltips (TDD - write tests FIRST)

- [ ] T077 [P] Write unit tests for HoverProvider in tests/unit/providers/hoverProvider.test.ts covering field hover
- [ ] T078 [P] Write unit tests for message hover in tests/unit/providers/hoverProvider.test.ts
- [ ] T079 [P] Write unit tests for enum hover in tests/unit/providers/hoverProvider.test.ts

### Implementation for Hover Tooltips

- [ ] T080 [P] Implement HoverProvider class in src/providers/hoverProvider.ts with provideHover method
- [ ] T081 Implement field hover showing type, field number, modifiers (repeated/optional), and documentation in HoverProvider
- [ ] T082 [P] Implement message hover showing documentation and field count in HoverProvider
- [ ] T083 [P] Implement enum hover showing documentation and value count in HoverProvider
- [ ] T084 [P] Implement service hover showing documentation and method count in HoverProvider
- [ ] T085 Register HoverProvider in src/extension.ts activate() function
- [ ] T086 Verify performance: hover tooltips appear within 100ms

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [ ] T087 [P] Create comprehensive README.md with feature descriptions, installation, usage, and examples
- [ ] T088 [P] Create CHANGELOG.md documenting version 0.1.0 features
- [ ] T089 [P] Add extension icon and marketplace assets to package.json
- [ ] T090 [P] Document any TypeScript `any` types with justification per constitution requirements
- [ ] T091 Setup file system watcher in src/extension.ts to detect .proto file changes (create, modify, delete)
- [ ] T092 Implement cache invalidation in SymbolTable when files change
- [ ] T093 [P] Add memory usage monitoring to ensure <50MB constraint
- [ ] T094 [P] Add performance benchmarks for all critical paths (parsing, completion, navigation) in tests/benchmarks/
- [ ] T095 Run all unit tests and ensure >80% code coverage
- [ ] T096 Run all integration tests and verify all acceptance scenarios pass
- [ ] T097 [P] Manual testing with large workspace (100+ proto files) to verify scalability
- [ ] T098 [P] Manual testing with large files (>10MB) to verify incremental parsing works
- [ ] T099 [P] Test extension activation time is <500ms
- [ ] T100 Create .vsix package using vsce for distribution

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Hover Tooltips (Phase 8)**: Depends on Foundational phase, can run parallel with user stories
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but builds on same foundation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Uses ProtoParser from foundational phase
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Independent of other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Utilities before providers that depend on them
- Provider implementation before registration
- Integration tests after provider registration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks can proceed sequentially (parser is prerequisite for providers)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Tests for a user story marked [P] can run in parallel
- Utilities within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch tests for User Story 2 together (TDD - write tests first):
Task T029: "Write unit tests for CompletionProvider covering keyword completion"
Task T030: "Write unit tests for import path completion"

# Launch utilities for User Story 2 together (after tests written):
Task T032: "Implement ProtoFinder utility"
Task T033: "Write unit tests for ProtoFinder"

# Sequential implementation (depends on utilities):
Task T034: "Implement CompletionProvider class"
Task T035-T038: "Add completion features to CompletionProvider"
Task T039: "Register CompletionProvider"
Task T040: "Verify performance"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Syntax Highlighting)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users have basic syntax highlighting

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (now with completion)
4. Add User Story 3 → Test independently → Deploy/Demo (now with navigation)
5. Add User Story 4 → Test independently → Deploy/Demo (now with error detection)
6. Add User Story 5 → Test independently → Deploy/Demo (complete feature set)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Syntax Highlighting)
   - Developer B: User Story 2 (Code Completion)
   - Developer C: User Story 3 (Navigation)
3. Stories complete and integrate independently
4. Developer D can work on User Story 4 & 5 while A/B/C finish
5. All developers collaborate on Phase 9 (Polish)

---

## Notes

- **TDD Mandatory**: Per constitution, tests MUST be written BEFORE implementation
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Constitutional Compliance Checklist

Before marking any phase complete:

- [ ] Tests written BEFORE implementation (TDD)
- [ ] All tests passing for completed stories
- [ ] Code reviewed (if team environment)
- [ ] No `any` types without documentation
- [ ] Error handling in place
- [ ] Performance benchmarks passing
- [ ] Documentation updated
- [ ] User story independently testable

---

**Total Task Count**: 100 tasks
- Setup: 10 tasks
- Foundational: 10 tasks
- User Story 1 (P1 - MVP): 8 tasks
- User Story 2 (P2): 12 tasks
- User Story 3 (P3): 12 tasks
- User Story 4 (P4): 13 tasks
- User Story 5 (P5): 11 tasks
- Hover Tooltips: 10 tasks
- Polish: 14 tasks

**MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1) = 28 tasks for basic syntax highlighting

**Parallel Opportunities**: 42 tasks can run in parallel within their phases
