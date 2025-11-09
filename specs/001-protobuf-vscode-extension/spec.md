# Feature Specification: Protocol Buffers VSCode Extension

**Feature Branch**: `001-protobuf-vscode-extension`
**Created**: 2025-11-09
**Status**: Draft
**Input**: User description: "Build an extension for VisualStudio Code. The extension is for Protocol Buffers. The plugin can support to develop Protocol Buffers. For example providing highlight a proto file."

## Clarifications

### Session 2025-11-09

- Q: When should the extension parse and validate proto files using protobuf.js? → A: On-change with debouncing - Parse 300ms after user stops typing, balancing responsiveness with resource usage
- Q: What indentation style should the Format Document feature use? → A: 2 spaces - Common in proto files and web development, more compact
- Q: How should the extension resolve import paths when navigating to definitions in imported files? → A: Workspace with common proto paths - Check workspace root plus common proto locations (proto/, protos/, src/proto/)
- Q: What information should hover tooltips display when hovering over proto elements? → A: Type with details - Show type, field number, modifiers (repeated/optional), and documentation comments if present
- Q: What level of semantic validation should error diagnostics perform? → A: Within-file semantics - Check syntax plus semantics within current file (duplicate field numbers, undefined types in file)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Syntax Highlighting for Proto Files (Priority: P1)

As a developer working with Protocol Buffers, I need syntax highlighting for .proto files so that I can easily read and understand the structure of my protobuf definitions. Keywords, types, comments, and strings should be visually distinct, making it easier to spot errors and navigate the file.

**Why this priority**: Syntax highlighting is the most fundamental feature users expect from any language extension. Without it, the extension provides no value. This is the minimum viable product that makes the extension useful.

**Independent Test**: Can be fully tested by opening a .proto file in VSCode and verifying that keywords (message, service, rpc, etc.), types (string, int32, etc.), comments, and strings are displayed in different colors.

**Acceptance Scenarios**:

1. **Given** a .proto file is opened in VSCode, **When** the file contains message definitions with fields, **Then** keywords like "message", "service", "rpc" are highlighted in one color, type names in another, and field names in plain text
2. **Given** a .proto file with comments, **When** viewing the file, **Then** single-line comments (//) and multi-line comments (/* */) are displayed in a distinct color (typically green or gray)
3. **Given** a .proto file with string literals, **When** viewing the file, **Then** string values in quotes are highlighted distinctly from surrounding code
4. **Given** a .proto file with package declarations and imports, **When** viewing the file, **Then** package names and import paths are properly highlighted

---

### User Story 2 - Code Completion for Proto Syntax (Priority: P2)

As a developer writing Protocol Buffer definitions, I need IntelliSense code completion for proto syntax so that I can write proto files faster and with fewer syntax errors. When I start typing, the extension should suggest valid keywords, field types, and options.

**Why this priority**: Code completion significantly improves developer productivity and reduces syntax errors. This builds on the syntax highlighting foundation to provide active development assistance.

**Independent Test**: Can be tested by opening a .proto file, typing partial keywords or types, and verifying that appropriate suggestions appear in the completion menu.

**Acceptance Scenarios**:

1. **Given** I'm editing a .proto file and type "mes", **When** I trigger code completion, **Then** "message" appears as a suggestion
2. **Given** I'm inside a message definition and type a field type prefix like "int", **When** code completion triggers, **Then** suggestions include "int32", "int64", etc.
3. **Given** I'm defining a field and type "option", **When** code completion triggers, **Then** common options like "deprecated", "packed" are suggested
4. **Given** I'm typing an import statement, **When** I start typing the path, **Then** available .proto files from workspace root and standard proto directories (proto/, protos/, src/proto/) are suggested

---

### User Story 3 - Go to Definition Navigation (Priority: P3)

As a developer working with large protobuf schemas, I need to navigate to message and service definitions so that I can quickly understand dependencies and relationships between types. When I click on a type reference, I should jump to where it's defined.

**Why this priority**: Navigation features are essential for working with complex proto files but aren't needed until you have multiple definitions to navigate between. This enhances the development experience after basic editing is functional.

**Independent Test**: Can be tested by opening a .proto file with message references, right-clicking on a type name, selecting "Go to Definition", and verifying navigation to the definition location.

**Acceptance Scenarios**:

1. **Given** a message field references another message type, **When** I right-click the type name and select "Go to Definition", **Then** the cursor jumps to the message definition
2. **Given** a message is defined in an imported file, **When** I use "Go to Definition" on the type, **Then** the imported file opens at the correct definition
3. **Given** a service definition references message types, **When** I navigate to a request or response type, **Then** I'm taken to the message definition
4. **Given** an enum type is referenced in a field, **When** I use "Go to Definition", **Then** the cursor jumps to the enum definition

---

### User Story 4 - Error Detection and Diagnostics (Priority: P4)

As a developer, I need real-time error detection in my proto files so that I can catch syntax and semantic errors as I type, rather than discovering them during compilation. Errors should be underlined with helpful messages explaining the issue.

**Why this priority**: Error detection significantly improves the development experience by catching mistakes early. However, developers can still work effectively with syntax highlighting and completion while running the protoc compiler manually.

**Independent Test**: Can be tested by intentionally introducing errors (missing semicolons, undefined types, duplicate field numbers) and verifying that errors are highlighted with appropriate messages.

**Acceptance Scenarios**:

1. **Given** a message field is missing a semicolon, **When** viewing the file, **Then** an error underline appears with message "Expected semicolon"
2. **Given** a field references a message type not defined in the current file, **When** viewing the file, **Then** an error appears indicating the type is not found in the current file
3. **Given** two fields in a message have the same field number, **When** viewing the file, **Then** an error highlights the duplicate with an explanation
4. **Given** a syntax error is corrected, **When** I save the file, **Then** the error underline disappears within 1 second

---

### User Story 5 - Format Document Support (Priority: P5)

As a developer, I need to format proto files automatically so that my team maintains consistent code style without manual effort. When I trigger "Format Document", the extension should apply standard protobuf formatting conventions.

**Why this priority**: Code formatting is a convenience feature that improves code quality but is not essential for basic development. Developers can manually format or use external tools.

**Independent Test**: Can be tested by creating a poorly formatted .proto file, running "Format Document" command, and verifying that indentation, spacing, and line breaks follow conventions.

**Acceptance Scenarios**:

1. **Given** a .proto file with inconsistent indentation, **When** I run "Format Document", **Then** all message and field definitions are properly indented with 2 spaces per level
2. **Given** a file with irregular spacing around equals signs and braces, **When** formatting is applied, **Then** consistent spacing is applied
3. **Given** multiple fields on the same line, **When** formatting is applied, **Then** each field appears on its own line
4. **Given** a formatted file, **When** I run format again, **Then** no changes occur (formatting is idempotent)

---

### Edge Cases

- What happens when opening a very large .proto file (>10MB)? The extension should handle it without freezing the editor or consuming excessive memory.
- How does the extension handle malformed proto files with severe syntax errors? It should provide diagnostics without crashing and allow partial editing.
- What happens when a proto file imports definitions not found in workspace root or standard proto directories (proto/, protos/, src/proto/)? Navigation should show an appropriate error message indicating the import cannot be resolved.
- How does the extension behave when the protoc compiler is not installed? Features that require compilation should gracefully degrade or show helpful setup instructions.
- What happens when multiple proto files have circular dependencies? The extension should detect and report cycles without entering infinite loops.
- How should the extension handle types referenced from imported files? Since validation is within-file only, types from imports are assumed valid and will not show errors even if the import fails to resolve.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST provide syntax highlighting for all Protocol Buffer version 3 (proto3) syntax elements including messages, services, enums, fields, options, and comments
- **FR-002**: Extension MUST recognize .proto files and automatically activate when such files are opened
- **FR-003**: Extension MUST provide IntelliSense code completion for proto keywords, field types, common options, and import paths from workspace root and standard proto directories (proto/, protos/, src/proto/)
- **FR-004**: Extension MUST support "Go to Definition" functionality for message types, enums, and service definitions within the same file
- **FR-005**: Extension MUST support "Go to Definition" across imported proto files by searching workspace root and common proto directories (proto/, protos/, src/proto/)
- **FR-006**: Extension MUST display real-time error diagnostics for syntax errors (missing semicolons, invalid syntax) with parsing triggered 300ms after user stops typing
- **FR-007**: Extension MUST display within-file semantic diagnostics (undefined types within the same file, duplicate field numbers, invalid field options) with parsing triggered 300ms after user stops typing
- **FR-008**: Extension MUST support "Format Document" command that applies consistent indentation (2 spaces per level) and spacing
- **FR-009**: Extension MUST support both proto2 and proto3 syntax variants
- **FR-010**: Extension MUST provide hover tooltips showing type, field number, modifiers (repeated/optional), and documentation comments when hovering over proto elements

### Key Entities

- **Proto File**: Represents a .proto source file containing protocol buffer definitions. Contains messages, services, enums, and import statements.
- **Message Definition**: A structured data type with named fields, each having a type and unique field number.
- **Service Definition**: Contains RPC method declarations with request and response message types.
- **Field**: A named member of a message with a type, field number, and optional modifiers (repeated, optional).
- **Enum**: A type defining a set of named integer constants.
- **Import Statement**: References another proto file to use its definitions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can open any standard .proto file and immediately see syntax highlighting without configuration
- **SC-002**: Code completion suggestions appear within 100ms of triggering IntelliSense
- **SC-003**: "Go to Definition" navigates to the correct location within 200ms for 95% of valid references
- **SC-004**: Syntax errors are detected and displayed within 500ms after user stops typing (300ms debounce + 200ms parsing)
- **SC-005**: The extension activates and becomes ready within 500ms of opening a .proto file
- **SC-006**: Format Document completes within 1 second for proto files up to 1000 lines
- **SC-007**: The extension handles proto files up to 10MB without blocking the editor UI
- **SC-008**: 90% of developers can write basic proto definitions without referring to external documentation, using only the extension's IntelliSense and error messages

## Assumptions

- **Assumption 1**: The target audience consists primarily of software developers familiar with VSCode and basic Protocol Buffer concepts
- **Assumption 2**: Proto files will follow standard naming conventions (.proto extension) and be part of a VSCode workspace
- **Assumption 3**: Most proto files will be under 5000 lines and follow standard formatting conventions
- **Assumption 4**: The extension will initially focus on proto3 syntax as it is the current recommended version, with proto2 support for backward compatibility
- **Assumption 5**: Users have VSCode version 1.85 or later installed (released within last 2 years)
- **Assumption 6**: The extension will integrate with the protoc compiler if available but will provide value even without it installed
