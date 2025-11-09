# VSCode Extension API Contracts

**Date**: 2025-11-09
**Purpose**: Define the contracts between the extension and VSCode API

## Extension Manifest (package.json)

### Basic Information

```json
{
  "name": "protobuf-support",
  "displayName": "Protocol Buffers Support",
  "description": "Protocol Buffers language support with syntax highlighting, IntelliSense, and validation",
  "version": "0.1.0",
  "publisher": "TBD",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Programming Languages",
    "Linters",
    "Formatters"
  ],
  "keywords": [
    "protobuf",
    "protocol buffers",
    "proto",
    "grpc"
  ]
}
```

### Activation Events

```json
{
  "activationEvents": [
    "onLanguage:proto"
  ]
}
```

**Contract**: Extension activates when a `.proto` file is opened or when the workspace contains proto files.

### Language Configuration

```json
{
  "contributes": {
    "languages": [
      {
        "id": "proto",
        "aliases": ["Protocol Buffers", "proto"],
        "extensions": [".proto"],
        "configuration": "./language-configuration.json"
      }
    ]
  }
}
```

**Contract**: Register `proto` as a language identifier with `.proto` file extension.

### Grammar Contribution

```json
{
  "contributes": {
    "grammars": [
      {
        "language": "proto",
        "scopeName": "source.proto",
        "path": "./syntaxes/proto.tmLanguage.json"
      }
    ]
  }
}
```

**Contract**: Provide TextMate grammar for syntax highlighting.

### Configuration Contribution

```json
{
  "contributes": {
    "configuration": {
      "title": "Protocol Buffers",
      "properties": {
        "proto.formatting.indentSize": {
          "type": "number",
          "default": 2,
          "description": "Number of spaces per indentation level"
        },
        "proto.validation.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable real-time syntax and semantic validation"
        },
        "proto.validation.debounceMs": {
          "type": "number",
          "default": 300,
          "description": "Milliseconds to wait after typing before validating"
        }
      }
    }
  }
}
```

**Contract**: Expose user-configurable settings.

---

## Language Provider Contracts

### 1. CompletionItemProvider

**Interface**: `vscode.CompletionItemProvider`

**Contract**: Provide code completion suggestions at cursor position.

**Methods**:

```typescript
provideCompletionItems(
  document: TextDocument,
  position: Position,
  token: CancellationToken,
  context: CompletionContext
): ProviderResult<CompletionItem[] | CompletionList>
```

**Input**:
- `document`: Current text document
- `position`: Cursor position (line, character)
- `context`: Trigger kind (invoked, trigger character, etc.)

**Output**: Array of `CompletionItem` with:
- `label`: Display text (e.g., "message", "int32")
- `kind`: CompletionItemKind (Keyword, Class, Property, etc.)
- `detail`: Additional info (e.g., type signature)
- `documentation`: Markdown explanation
- `insertText`: Text to insert (may be SnippetString)
- `filterText`: Text used for filtering
- `sortText`: Text used for sorting

**Trigger Characters**: None (triggered on any character)

**Performance Requirement**: Return within 100ms

**Example Completions**:
- Keywords: `message`, `service`, `rpc`, `enum`, `import`
- Field types: `string`, `int32`, `int64`, `bool`, `bytes`
- Options: `deprecated`, `packed`
- Message types: Available messages in current file and imports

---

### 2. DefinitionProvider

**Interface**: `vscode.DefinitionProvider`

**Contract**: Navigate to definition of symbol under cursor.

**Methods**:

```typescript
provideDefinition(
  document: TextDocument,
  position: Position,
  token: CancellationToken
): ProviderResult<Definition | DefinitionLink[]>
```

**Input**:
- `document`: Current text document
- `position`: Cursor position

**Output**: `Location` or `LocationLink` with:
- `uri`: Target file URI
- `range`: Target range in file (line, character)
- `originSelectionRange`: Source symbol range (for peek preview)

**Performance Requirement**: Return within 200ms

**Supported Symbols**:
- Message type references → Message definition
- Enum type references → Enum definition
- Field types → Type definition
- Import paths → Imported file
- Service method types → Message definition

---

### 3. HoverProvider

**Interface**: `vscode.HoverProvider`

**Contract**: Show information when hovering over a symbol.

**Methods**:

```typescript
provideHover(
  document: TextDocument,
  position: Position,
  token: CancellationToken
): ProviderResult<Hover>
```

**Input**:
- `document`: Current text document
- `position`: Hover position

**Output**: `Hover` with:
- `contents`: MarkdownString with formatted information
- `range`: Range to highlight

**Performance Requirement**: Return within 100ms

**Hover Content Format**:
```markdown
**Type**: MessageDefinition
**Field Number**: 1
**Modifiers**: repeated

---

User message with ID and name fields
```

**Supported Symbols**:
- Fields: Show type, field number, modifiers, documentation
- Messages: Show documentation, field count
- Enums: Show documentation, value count
- Services: Show documentation, method count

---

### 4. DocumentFormattingEditProvider

**Interface**: `vscode.DocumentFormattingEditProvider`

**Contract**: Format entire document.

**Methods**:

```typescript
provideDocumentFormattingEdits(
  document: TextDocument,
  options: FormattingOptions,
  token: CancellationToken
): ProviderResult<TextEdit[]>
```

**Input**:
- `document`: Document to format
- `options`: Formatting options (tabSize, insertSpaces)

**Output**: Array of `TextEdit` with:
- `range`: Range to replace
- `newText`: Replacement text

**Performance Requirement**: Return within 1 second for files up to 1000 lines

**Formatting Rules**:
- Indentation: 2 spaces per level (configurable)
- One field per line
- Consistent spacing around `=` and `{}`
- Preserve comments
- Sort imports (optional)

---

### 5. DiagnosticCollection

**Interface**: `vscode.DiagnosticCollection`

**Contract**: Report errors and warnings.

**Usage**:

```typescript
const diagnostics = vscode.languages.createDiagnosticCollection('proto');

// Set diagnostics for a file
diagnostics.set(document.uri, [
  new vscode.Diagnostic(
    range,           // Where the error is
    message,         // Error message
    severity         // Error, Warning, Info, Hint
  )
]);
```

**Diagnostic Properties**:
- `range`: Location of error (line, character)
- `message`: Human-readable error message
- `severity`: DiagnosticSeverity.Error or Warning
- `code`: Error code (e.g., "missing-semicolon")
- `source`: "protobuf" (extension identifier)
- `relatedInformation`: Optional related locations

**Performance Requirement**: Update within 500ms after typing stops (300ms debounce + 200ms parsing)

**Error Types**:
- Syntax errors: Missing semicolons, invalid syntax
- Semantic errors: Duplicate field numbers, undefined types (within file only)
- Warning: Deprecated fields, proto2 vs proto3 issues

---

## File System Watcher Contract

**Purpose**: Detect when .proto files are created, modified, or deleted.

**Usage**:

```typescript
const watcher = vscode.workspace.createFileSystemWatcher('**/*.proto');

watcher.onDidCreate(uri => {
  // Parse new file
});

watcher.onDidChange(uri => {
  // Re-parse changed file (debounced)
});

watcher.onDidDelete(uri => {
  // Remove from symbol table
});
```

**Contract**:
- Watch all `.proto` files in workspace
- Invalidate cache on changes
- Clean up on extension deactivate

---

## Document Change Listener Contract

**Purpose**: Re-validate on document changes.

**Usage**:

```typescript
vscode.workspace.onDidChangeTextDocument(event => {
  if (event.document.languageId === 'proto') {
    // Debounce and re-parse
  }
});
```

**Contract**:
- Listen to all text document changes
- Filter for `proto` language ID
- Debounce parsing (300ms)
- Update diagnostics after parse

---

## Extension API Surface

### Exported API (Optional)

**Purpose**: Allow other extensions to interact with this extension.

**Contract**:

```typescript
export interface ProtoExtensionAPI {
  /**
   * Get parsed proto file information
   */
  getProtoFile(uri: string): ProtoFile | null;

  /**
   * Find message definition by fully qualified name
   */
  findMessage(fqn: string): MessageDefinition | null;

  /**
   * Validate a proto file and return errors
   */
  validateFile(uri: string): ParseError[];
}
```

**Usage by other extensions**:

```typescript
const protoExt = vscode.extensions.getExtension('publisher.protobuf-support');
const api: ProtoExtensionAPI = await protoExt.activate();
const protoFile = api.getProtoFile('file:///path/to/file.proto');
```

---

## Commands

**Registered Commands**:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "proto.format",
        "title": "Format Proto File",
        "category": "Protocol Buffers"
      }
    ]
  }
}
```

**Contract**: Commands accessible via command palette (Cmd/Ctrl+Shift+P).

---

## Performance Contracts Summary

| Operation | Maximum Latency | Notes |
|-----------|----------------|-------|
| Extension Activation | 500ms | Initial activation |
| Code Completion | 100ms | Per invocation |
| Go to Definition | 200ms | Per invocation |
| Hover Tooltip | 100ms | Per invocation |
| Document Formatting | 1000ms | Files up to 1000 lines |
| Diagnostics Update | 500ms | After debounce (300ms + 200ms parse) |
| File Parse | 200ms | Files up to 5000 lines |

---

## Error Handling Contracts

**Extension Activation Failures**:
- Log error to output channel
- Show notification to user
- Gracefully degrade (disable features)

**Parse Failures**:
- Store errors in ProtoFile.parseErrors
- Show diagnostics to user
- Continue providing partial features

**Provider Failures**:
- Catch and log exceptions
- Return empty results
- Don't crash extension

---

## Testing Contracts

### Unit Tests

**Framework**: Jest

**Test Files**: `*.test.ts` files in `tests/unit/`

**Contract**: Each provider and parser must have unit tests with >80% coverage.

### Integration Tests

**Framework**: VSCode Extension Test Runner

**Test Files**: `*.test.ts` files in `tests/integration/`

**Contract**: Test extension activation, provider registration, and end-to-end workflows.

**Test Fixture**: Sample .proto files in `tests/fixtures/`

---

## Packaging Contracts

**Output**: `.vsix` file for distribution

**Included Files**:
- Compiled JavaScript (`out/`)
- Grammar files (`syntaxes/`)
- Configuration files
- README.md
- CHANGELOG.md
- LICENSE

**Excluded Files** (via `.vscodeignore`):
- Source TypeScript files
- Tests
- Development configurations
- node_modules (bundled separately)

---

This contract document ensures all interactions with the VSCode API are well-defined and testable, supporting the constitutional requirements for code quality and maintainability.
