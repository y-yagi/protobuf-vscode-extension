# Quickstart Guide: Protocol Buffers VSCode Extension

**Date**: 2025-11-09
**Purpose**: Quick reference for developers implementing the extension

## Prerequisites

- **Node.js**: 18.x LTS or later
- **npm**: 9.x or later
- **VSCode**: 1.85 or later for development
- **TypeScript**: 5.x (installed as dev dependency)
- **Git**: For version control

## Initial Setup

### 1. Initialize Project

```bash
# Create project directory
mkdir protobuf-vscode-extension
cd protobuf-vscode-extension

# Initialize npm project
npm init -y

# Initialize TypeScript
npx tsc --init

# Initialize git
git init
```

### 2. Install Dependencies

```bash
# Production dependencies
npm install protobufjs@^7.0.0

# Development dependencies
npm install --save-dev \
  @types/vscode@^1.85.0 \
  @types/node@^18.0.0 \
  @vscode/test-electron \
  @vscode/vsce \
  typescript@^5.0.0 \
  jest@^29.0.0 \
  @types/jest@^29.0.0 \
  ts-jest@^29.0.0
```

### 3. Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./out",
    "rootDir": "./src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out", "tests"]
}
```

### 4. Create Package.json Extension Manifest

```json
{
  "name": "protobuf-support",
  "displayName": "Protocol Buffers Support",
  "description": "Protocol Buffers language support",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Programming Languages"],
  "activationEvents": ["onLanguage:proto"],
  "main": "./out/extension.js",
  "contributes": {
    "languages": [{
      "id": "proto",
      "aliases": ["Protocol Buffers", "proto"],
      "extensions": [".proto"]
    }],
    "grammars": [{
      "language": "proto",
      "scopeName": "source.proto",
      "path": "./syntaxes/proto.tmLanguage.json"
    }]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "jest",
    "test:integration": "node ./out/tests/integration/runTest.js",
    "lint": "eslint src --ext ts",
    "package": "vsce package"
  }
}
```

### 5. Create Project Structure

```bash
mkdir -p src/{parser,providers,utils,grammars}
mkdir -p tests/{unit/{parser,providers,utils},integration,fixtures}
```

## Development Workflow

### Phase 1: Syntax Highlighting (User Story 1 - P1)

**Objective**: Provide TextMate grammar for proto files.

**Steps**:

1. **Create Grammar File**: `src/grammars/proto.tmLanguage.json`
   ```json
   {
     "scopeName": "source.proto",
     "patterns": [
       {
         "name": "keyword.control.proto",
         "match": "\\b(message|service|rpc|enum|import|package|option)\\b"
       },
       {
         "name": "storage.type.proto",
         "match": "\\b(string|int32|int64|bool|bytes|double|float)\\b"
       },
       {
         "name": "comment.line.double-slash.proto",
         "match": "//.*$"
       }
     ]
   }
   ```

2. **Test Grammar**:
   - Open VSCode
   - Press F5 to launch Extension Development Host
   - Create test.proto file
   - Verify syntax highlighting

3. **Write Tests**: No unit tests needed for grammar (visual testing sufficient)

---

### Phase 2: Parser Implementation (Foundation for P2-P5)

**Objective**: Parse proto files using protobuf.js.

**Files to Create**:

1. **src/parser/protoParser.ts**
   ```typescript
   import * as protobuf from 'protobufjs';
   import { ProtoFile, ParseError } from '../types';

   export class ProtoParser {
     parse(content: string, uri: string): ProtoFile {
       // Use protobuf.parse() to get AST
       // Transform to our ProtoFile structure
       // Handle errors gracefully
     }
   }
   ```

2. **src/parser/symbolTable.ts**
   ```typescript
   export class SymbolTable {
     private files = new Map<string, ProtoFile>();

     addFile(file: ProtoFile): void { }
     removeFile(uri: string): void { }
     findMessage(fqn: string): MessageDefinition | null { }
   }
   ```

3. **src/parser/debouncer.ts**
   ```typescript
   export class Debouncer {
     debounce(fn: () => void, delay: number): void {
       // Implement 300ms debouncing
     }
   }
   ```

**Test Files**:
- `tests/unit/parser/protoParser.test.ts`
- `tests/unit/parser/symbolTable.test.ts`
- `tests/fixtures/sample.proto` (test data)

**TDD Approach**:
1. Write failing test
2. Implement minimal code to pass
3. Refactor
4. Repeat

---

### Phase 3: Code Completion (User Story 2 - P2)

**Objective**: Implement IntelliSense completion provider.

**Files to Create**:

1. **src/providers/completionProvider.ts**
   ```typescript
   import * as vscode from 'vscode';

   export class ProtoCompletionProvider implements vscode.CompletionItemProvider {
     provideCompletionItems(
       document: vscode.TextDocument,
       position: vscode.Position
     ): vscode.CompletionItem[] {
       // Return keywords, types, options based on context
     }
   }
   ```

2. **Register in src/extension.ts**
   ```typescript
   export function activate(context: vscode.ExtensionContext) {
     context.subscriptions.push(
       vscode.languages.registerCompletionItemProvider(
         'proto',
         new ProtoCompletionProvider()
       )
     );
   }
   ```

**Test**: `tests/unit/providers/completionProvider.test.ts`

---

### Phase 4: Go to Definition (User Story 3 - P3)

**Files to Create**:
- `src/providers/definitionProvider.ts`
- `src/utils/pathResolver.ts` (for import resolution)
- `tests/unit/providers/definitionProvider.test.ts`

---

### Phase 5: Error Diagnostics (User Story 4 - P4)

**Files to Create**:
- `src/providers/diagnosticsProvider.ts`
- `tests/unit/providers/diagnosticsProvider.test.ts`

---

### Phase 6: Document Formatting (User Story 5 - P5)

**Files to Create**:
- `src/providers/formattingProvider.ts`
- `tests/unit/providers/formattingProvider.test.ts`

---

## Testing

### Running Unit Tests

```bash
npm test
```

### Running Integration Tests

```bash
npm run test:integration
```

### Manual Testing

1. Press F5 in VSCode to launch Extension Development Host
2. Open sample .proto files from `tests/fixtures/`
3. Test each feature:
   - Syntax highlighting
   - Code completion (Ctrl+Space)
   - Go to definition (F12 or Cmd+Click)
   - Hover tooltips
   - Error diagnostics
   - Format document (Shift+Alt+F)

## Debugging

### Debug Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "npm: watch"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/tests/integration"
      ],
      "outFiles": ["${workspaceFolder}/out/**/*.js"]
    }
  ]
}
```

## Performance Benchmarking

### Add Benchmark Tests

```typescript
// tests/benchmarks/parsePerformance.test.ts
describe('Parse Performance', () => {
  it('should parse 1000-line file in <50ms', () => {
    const start = Date.now();
    parser.parse(largeProtoContent);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
```

### Run Benchmarks

```bash
npm run test:benchmark
```

## Building & Packaging

### Compile TypeScript

```bash
npm run compile
```

### Package Extension

```bash
npm run package
```

Creates `protobuf-support-0.1.0.vsix`

### Install Locally

```bash
code --install-extension protobuf-support-0.1.0.vsix
```

## Common Issues & Solutions

### Issue: Extension doesn't activate

**Solution**: Check `activationEvents` in package.json includes `onLanguage:proto`

### Issue: Syntax highlighting not working

**Solution**: Verify grammar file path in package.json matches actual file location

### Issue: Providers not triggering

**Solution**: Ensure providers are registered in `activate()` function and added to `context.subscriptions`

### Issue: Tests fail with module not found

**Solution**: Run `npm run compile` before running tests

### Issue: Performance is slow

**Solution**:
- Verify debouncing is working (300ms delay)
- Check symbol table cache is being used
- Profile with VSCode Performance Monitor

## Next Steps

After completing implementation:

1. **Run `/speckit.tasks`**: Generate detailed task list
2. **Implement each task**: Following TDD approach
3. **Test thoroughly**: Unit + integration tests
4. **Benchmark**: Verify performance requirements
5. **Document**: Update README with features
6. **Package**: Create .vsix for distribution

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/extension.ts` | Extension entry point |
| `src/parser/protoParser.ts` | Proto file parsing |
| `src/parser/symbolTable.ts` | Symbol cache |
| `src/providers/*.ts` | VSCode language providers |
| `src/grammars/proto.tmLanguage.json` | Syntax grammar |
| `tests/unit/**/*.test.ts` | Unit tests |
| `tests/integration/**/*.test.ts` | Integration tests |
| `package.json` | Extension manifest |

## Constitutional Compliance Checklist

Before considering any phase complete:

- [ ] Tests written BEFORE implementation
- [ ] All tests passing
- [ ] Code reviewed (if team)
- [ ] No `any` types without documentation
- [ ] Error handling in place
- [ ] Performance benchmarks passing
- [ ] Documentation updated

---

This quickstart provides a clear path from empty project to working extension, following the constitutional principles of test-driven development, code quality, and performance.
