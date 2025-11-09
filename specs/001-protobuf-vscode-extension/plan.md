# Implementation Plan: Protocol Buffers VSCode Extension

**Branch**: `001-protobuf-vscode-extension` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-protobuf-vscode-extension/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a VSCode extension that provides comprehensive Protocol Buffer (.proto file) development support including syntax highlighting, IntelliSense code completion, go-to-definition navigation, real-time error diagnostics, and document formatting. The extension uses protobuf.js for parsing and validation, with debounced parsing (300ms) to balance responsiveness and resource usage. The extension activates within 500ms and handles files up to 10MB without blocking the UI.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 18.x (VSCode extension standard)
**Primary Dependencies**:
- VSCode Extension API 1.85+
- protobuf.js (for proto file parsing and validation)
- TextMate grammar (for syntax highlighting)

**Storage**: File system only (reads .proto files from workspace)
**Testing**:
- Jest or Mocha (unit tests)
- VSCode Extension Test Runner (integration tests)
- Manual testing with sample .proto files

**Target Platform**: VSCode 1.85+ on Windows, macOS, Linux
**Project Type**: Single VSCode extension project
**Performance Goals**:
- Extension activation: <500ms
- Code completion response: <100ms
- Go to definition: <200ms
- Error detection: <500ms after typing stops (300ms debounce + 200ms parsing)
- Format document: <1s for files up to 1000 lines

**Constraints**:
- Must not block VSCode UI thread
- Memory usage <50MB for typical workspace
- Parse files incrementally for files >10MB
- Support both proto2 and proto3 syntax

**Scale/Scope**:
- Handle workspaces with 100+ proto files
- Individual files up to 10MB
- Support for standard proto directories (proto/, protos/, src/proto/)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Implementation Gate (from Constitution)

- [x] Feature specification written and approved (spec.md complete)
- [x] Test scenarios defined (5 user stories with acceptance scenarios)
- [x] Performance requirements identified (activation <500ms, parsing <500ms, etc.)
- [x] UX patterns reviewed for consistency (follows VSCode extension patterns)

**Status**: ✅ PASSED - All pre-implementation gates met

### Code Quality Principles Check

**I. Code Quality First**
- ✅ TypeScript provides strong type safety
- ✅ VSCode Extension API enforces modularity
- ✅ Error handling required for all parsing operations
- ⚠️ Need to document any required `any` types (e.g., protobuf.js type definitions)

**II. Test-Driven Development (Mandatory)**
- ✅ Spec includes testable acceptance criteria for each user story
- ✅ Unit tests required for parser, completion provider, formatter
- ✅ Integration tests required for VSCode extension activation and commands
- ⚠️ Tests must be written BEFORE implementation

**III. User Experience Consistency**
- ✅ Uses standard VSCode command palette, context menus, hover tooltips
- ✅ Error messages defined as actionable (e.g., "Expected semicolon")
- ✅ Debounced parsing prevents UI stuttering
- ✅ Graceful degradation for missing imports

**IV. Performance Requirements**
- ✅ All performance targets explicitly defined in spec
- ✅ Debouncing strategy defined (300ms)
- ✅ Large file handling strategy needed (incremental parsing)
- ⚠️ Performance benchmarks must be added to prevent regressions

**Constitution Compliance**: ✅ PASSED with notes
- All principles satisfied
- Implementation must adhere to TDD (write tests first)
- Performance benchmarks required
- Document any TypeScript `any` type usage

## Project Structure

### Documentation (this feature)

```text
specs/001-protobuf-vscode-extension/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── vscode-api.md    # VSCode extension API contracts
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── extension.ts              # Extension entry point, activation
├── parser/
│   ├── protoParser.ts        # protobuf.js wrapper for parsing
│   ├── debouncer.ts          # Debouncing logic for parse events
│   └── symbolTable.ts        # Cache of parsed definitions
├── providers/
│   ├── completionProvider.ts # IntelliSense code completion
│   ├── definitionProvider.ts # Go to definition navigation
│   ├── hoverProvider.ts      # Hover tooltip information
│   ├── diagnosticsProvider.ts # Error detection and reporting
│   └── formattingProvider.ts # Document formatting
├── utils/
│   ├── pathResolver.ts       # Import path resolution logic
│   └── protoFinder.ts        # Find .proto files in workspace
└── grammars/
    └── proto.tmLanguage.json # TextMate grammar for syntax highlighting

tests/
├── unit/
│   ├── parser/
│   │   ├── protoParser.test.ts
│   │   └── symbolTable.test.ts
│   ├── providers/
│   │   ├── completionProvider.test.ts
│   │   ├── definitionProvider.test.ts
│   │   ├── hoverProvider.test.ts
│   │   ├── diagnosticsProvider.test.ts
│   │   └── formattingProvider.test.ts
│   └── utils/
│       ├── pathResolver.test.ts
│       └── protoFinder.test.ts
├── integration/
│   ├── extension.test.ts     # Extension activation tests
│   ├── completion.test.ts    # End-to-end completion tests
│   ├── navigation.test.ts    # End-to-end navigation tests
│   └── diagnostics.test.ts   # End-to-end error detection tests
└── fixtures/
    └── *.proto               # Sample proto files for testing

package.json                   # Extension manifest, dependencies
tsconfig.json                  # TypeScript configuration
.vscodeignore                  # Files to exclude from extension package
README.md                      # Extension documentation (created in Phase 1)
```

**Structure Decision**: Single VSCode extension project structure following standard TypeScript extension patterns. The `src/` directory contains all source code organized by functionality (parser, providers, utils). The `tests/` directory mirrors the source structure with unit and integration tests. Grammar files for syntax highlighting are stored in `src/grammars/`. This structure aligns with VSCode extension best practices and supports the constitutional requirements for modularity and testability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution principles are satisfied by the planned architecture.
