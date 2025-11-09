# Data Model: Protocol Buffers VSCode Extension

**Date**: 2025-11-09
**Purpose**: Define the internal data structures and their relationships for the VSCode extension

## Overview

This extension maintains in-memory data structures representing parsed Protocol Buffer definitions. These structures support code completion, navigation, error detection, and hover information features.

## Core Entities

### 1. ProtoFile

Represents a parsed .proto source file with all its definitions.

**Attributes**:
- `uri`: string - Absolute file system path (VSCode URI)
- `content`: string - Raw file content
- `syntax`: 'proto2' | 'proto3' - Proto syntax version
- `package`: string | null - Package declaration (e.g., "foo.bar.baz")
- `imports`: Import[] - List of import statements
- `messages`: MessageDefinition[] - Top-level message definitions
- `enums`: EnumDefinition[] - Top-level enum definitions
- `services`: ServiceDefinition[] - Service definitions
- `options`: Option[] - File-level options
- `lastModified`: number - Timestamp of last file modification
- `parseErrors`: ParseError[] - Any errors encountered during parsing

**Relationships**:
- Contains: MessageDefinition[], EnumDefinition[], ServiceDefinition[]
- References: Other ProtoFile instances via imports

**Validation Rules**:
- `uri` must be a valid file path with .proto extension
- `syntax` defaults to 'proto3' if not explicitly declared
- `package` must follow protobuf naming rules (lowercase, dot-separated)

**Lifecycle**:
- Created: When .proto file is opened or parsed
- Updated: When file content changes (after debounce period)
- Destroyed: When file is closed or workspace is closed

---

### 2. MessageDefinition

Represents a message type definition in a proto file.

**Attributes**:
- `name`: string - Message name (e.g., "User")
- `fullyQualifiedName`: string - Full name including package (e.g., "foo.bar.User")
- `fields`: Field[] - Message fields
- `nestedMessages`: MessageDefinition[] - Nested message definitions
- `nestedEnums`: EnumDefinition[] - Nested enum definitions
- `options`: Option[] - Message-level options
- `location`: Location - Source code location (line, column)
- `documentation`: string | null - Documentation comment

**Relationships**:
- Contained by: ProtoFile or parent MessageDefinition
- Contains: Field[], MessageDefinition[] (nested), EnumDefinition[] (nested)
- Referenced by: Field (as field types), ServiceDefinition (as RPC types)

**Validation Rules**:
- `name` must be PascalCase and unique within scope
- Cannot have duplicate field numbers
- Reserved field numbers/names must not be used

---

### 3. Field

Represents a field within a message.

**Attributes**:
- `name`: string - Field name (e.g., "user_id")
- `type`: FieldType - Field type (primitive, message, enum, map)
- `number`: number - Field number (1-536,870,911, excluding 19000-19999)
- `label`: 'optional' | 'required' | 'repeated' | null - Field label
- `defaultValue`: any | null - Default value (proto2 only)
- `options`: Option[] - Field-level options
- `location`: Location - Source code location
- `documentation`: string | null - Documentation comment

**Relationships**:
- Contained by: MessageDefinition
- References: MessageDefinition or EnumDefinition (if type is message/enum)

**Validation Rules**:
- `name` must be snake_case
- `number` must be unique within message
- `number` must be in valid range (not in reserved range 19000-19999)
- `label` 'required' is proto2 only
- Map fields cannot be repeated

---

### 4. EnumDefinition

Represents an enumeration type.

**Attributes**:
- `name`: string - Enum name (e.g., "Status")
- `fullyQualifiedName`: string - Full name including package
- `values`: EnumValue[] - Enum values
- `options`: Option[] - Enum-level options
- `location`: Location - Source code location
- `documentation`: string | null - Documentation comment

**Relationships**:
- Contained by: ProtoFile or MessageDefinition
- Referenced by: Field (as field types)

**Validation Rules**:
- `name` must be PascalCase and unique within scope
- First enum value must be 0 in proto3
- Enum value numbers must be unique unless allow_alias option is true

---

### 5. EnumValue

Represents a single value in an enumeration.

**Attributes**:
- `name`: string - Value name (e.g., "STATUS_UNKNOWN")
- `number`: number - Integer value
- `options`: Option[] - Value-level options
- `location`: Location - Source code location
- `documentation`: string | null - Documentation comment

**Relationships**:
- Contained by: EnumDefinition

**Validation Rules**:
- `name` must be UPPER_SNAKE_CASE
- `number` must be unique within enum (unless allow_alias option)
- First value must be 0 in proto3

---

### 6. ServiceDefinition

Represents a gRPC service definition.

**Attributes**:
- `name`: string - Service name (e.g., "UserService")
- `fullyQualifiedName`: string - Full name including package
- `methods`: RpcMethod[] - RPC methods
- `options`: Option[] - Service-level options
- `location`: Location - Source code location
- `documentation`: string | null - Documentation comment

**Relationships**:
- Contained by: ProtoFile
- Contains: RpcMethod[]

**Validation Rules**:
- `name` must be PascalCase and unique within file
- Cannot be empty (must have at least one method)

---

### 7. RpcMethod

Represents an RPC method within a service.

**Attributes**:
- `name`: string - Method name (e.g., "GetUser")
- `inputType`: string - Fully qualified request message type
- `outputType`: string - Fully qualified response message type
- `clientStreaming`: boolean - True if client sends stream
- `serverStreaming`: boolean - True if server sends stream
- `options`: Option[] - Method-level options
- `location`: Location - Source code location
- `documentation`: string | null - Documentation comment

**Relationships**:
- Contained by: ServiceDefinition
- References: MessageDefinition (for input/output types)

**Validation Rules**:
- `name` must be PascalCase and unique within service
- `inputType` and `outputType` must reference valid message types

---

### 8. Import

Represents an import statement.

**Attributes**:
- `path`: string - Import path (e.g., "google/protobuf/timestamp.proto")
- `modifier`: 'public' | 'weak' | null - Import modifier
- `resolved`: boolean - Whether import was successfully resolved
- `resolvedUri`: string | null - Absolute path to imported file
- `location`: Location - Source code location

**Relationships**:
- Contained by: ProtoFile
- References: Another ProtoFile (if resolved)

**Validation Rules**:
- `path` must be relative or follow standard proto import paths
- Public imports: Re-export the imported file's definitions
- Weak imports: Optional dependency

---

### 9. FieldType

Represents a field type (union type).

**Type Variants**:
```typescript
type FieldType =
  | { kind: 'primitive'; type: PrimitiveType }
  | { kind: 'message'; typeName: string }
  | { kind: 'enum'; typeName: string }
  | { kind: 'map'; keyType: PrimitiveType; valueType: FieldType }
```

**PrimitiveType Values**:
- `double`, `float`, `int32`, `int64`, `uint32`, `uint64`
- `sint32`, `sint64`, `fixed32`, `fixed64`, `sfixed32`, `sfixed64`
- `bool`, `string`, `bytes`

**Validation Rules**:
- Map keys can only be integral or string types
- Map values cannot be other maps

---

### 10. Option

Represents a proto option (file, message, field, etc.).

**Attributes**:
- `name`: string - Option name (e.g., "deprecated", "packed")
- `value`: any - Option value (string, number, boolean, etc.)
- `location`: Location - Source code location

**Common Options**:
- File: `java_package`, `java_outer_classname`, `optimize_for`
- Message: `deprecated`, `map_entry`
- Field: `deprecated`, `packed`, `default` (proto2)
- Enum: `allow_alias`, `deprecated`

---

### 11. Location

Represents source code location for error reporting and navigation.

**Attributes**:
- `line`: number - Zero-indexed line number
- `column`: number - Zero-indexed column number
- `endLine`: number - End line number (for ranges)
- `endColumn`: number - End column number

**Usage**:
- Error diagnostics: Show exactly where errors occur
- Go to definition: Jump to definition location
- Hover tooltips: Identify what the user is hovering over

---

### 12. ParseError

Represents an error encountered during parsing.

**Attributes**:
- `message`: string - Human-readable error message
- `location`: Location - Where the error occurred
- `severity`: 'error' | 'warning' - Error severity
- `code`: string - Error code (e.g., "missing-semicolon", "duplicate-field-number")

**Examples**:
- `{ message: "Expected semicolon", severity: "error", code: "missing-semicolon" }`
- `{ message: "Duplicate field number 1", severity: "error", code: "duplicate-field-number" }`
- `{ message: "Type 'Foo' not found in current file", severity: "error", code: "undefined-type" }`

---

### 13. SymbolTable

In-memory cache of all parsed definitions for fast lookup.

**Attributes**:
- `files`: Map<string, ProtoFile> - File URI -> ProtoFile mapping
- `messagesByFQN`: Map<string, MessageDefinition> - Fully qualified name -> Message
- `enumsByFQN`: Map<string, EnumDefinition> - Fully qualified name -> Enum
- `servicesByFQN`: Map<string, ServiceDefinition> - Fully qualified name -> Service

**Operations**:
- `addFile(file: ProtoFile)`: Add or update a parsed file
- `removeFile(uri: string)`: Remove a file from cache
- `findMessage(fqn: string): MessageDefinition | null`: Look up message by name
- `findEnum(fqn: string): EnumDefinition | null`: Look up enum by name
- `findDefinitionAt(uri: string, line: number, column: number): Definition | null`: Find definition at cursor position
- `clear()`: Clear all cached data

**Lifecycle**:
- Created: On extension activation
- Updated: On file changes (debounced)
- Cleared: On workspace close

---

## Data Flow

### Parsing Flow

```
.proto file change
  → Debouncer (300ms delay)
    → protobuf.js parse
      → ProtoFile + Definitions created
        → SymbolTable updated
          → Diagnostics generated
            → VSCode UI updated
```

### Completion Flow

```
User types in editor
  → VSCode completion request
    → Check context (in message? in service?)
      → Query SymbolTable for available symbols
        → Return completion items to VSCode
```

### Go to Definition Flow

```
User triggers "Go to Definition"
  → Get symbol under cursor
    → Look up in SymbolTable
      → Find definition location
        → Navigate to file/line/column
```

### Hover Flow

```
User hovers over symbol
  → Identify symbol type (field, message, enum, etc.)
    → Look up in SymbolTable
      → Extract type, documentation, modifiers
        → Format hover markdown
          → Display tooltip
```

## State Management

### Cache Invalidation

When a file changes:
1. Remove old ProtoFile from SymbolTable
2. Parse new content
3. Add new ProtoFile to SymbolTable
4. Update all references to this file's symbols
5. Regenerate diagnostics

### Memory Management

- Maximum SymbolTable size: 50MB
- If exceeded: Remove least recently used files
- Keep currently open files always cached
- Clear cache on workspace switch

## Validation Rules Summary

All validation rules are enforced during parsing and stored in `ParseError[]`:

1. **Naming Conventions**:
   - Messages/Enums/Services: PascalCase
   - Fields/Methods: snake_case
   - Enum values: UPPER_SNAKE_CASE
   - Packages: lowercase.dot.separated

2. **Field Numbers**:
   - Range: 1 to 536,870,911
   - Reserved: 19,000 to 19,999
   - Must be unique within message

3. **Proto3 Restrictions**:
   - No `required` fields
   - First enum value must be 0
   - No `default` field option

4. **Type Safety**:
   - All referenced types must be defined or imported
   - Map keys must be integral or string types
   - Circular references handled gracefully

## Extension Points

### Future Enhancements

1. **Cross-file validation**: Track dependencies between files to validate imported types
2. **Custom options**: Support for custom proto options
3. **Well-known types**: Built-in support for google/protobuf/* types
4. **Proto formatting**: Additional formatting options (comment style, line length)

---

This data model provides the foundation for all extension features while maintaining clear separation of concerns and supporting the constitutional requirements for modularity and testability.
