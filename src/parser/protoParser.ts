import * as protobuf from 'protobufjs';
import {
  ProtoFile,
  MessageDefinition,
  EnumDefinition,
  ServiceDefinition,
  Field,
  EnumValue,
  RpcMethod,
  Import,
  ParseError,
  FieldType,
} from '../types';

/**
 * ProtoParser - Parse .proto files using protobufjs
 */
export class ProtoParser {
  /**
   * Parse a proto file content
   * @param content Proto file content
   * @param uri File URI
   * @returns Parsed ProtoFile object
   */
  parse(content: string, uri: string): ProtoFile {
    const parseErrors: ParseError[] = [];
    let root: protobuf.Root;

    try {
      // Parse using protobufjs
      const parseResult = protobuf.parse(content, { keepCase: true });
      root = parseResult.root;
    } catch (error) {
      // Handle parse errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      parseErrors.push({
        message: errorMessage,
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
        severity: 'error',
        code: 'parse-error',
      });

      // Return minimal ProtoFile with error
      return {
        uri,
        content,
        syntax: 'proto3',
        package: null,
        imports: [],
        messages: [],
        enums: [],
        services: [],
        options: [],
        lastModified: Date.now(),
        parseErrors,
      };
    }

    // Extract syntax
    const syntax = this.extractSyntax(content);

    // Extract package - protobufjs doesn't store package directly, we need to extract it from content
    const packageName = this.extractPackage(content);

    // Extract imports
    const imports = this.extractImports(content);

    // Extract top-level messages
    const messages: MessageDefinition[] = [];
    const enums: EnumDefinition[] = [];
    const services: ServiceDefinition[] = [];

    // Walk through the parsed AST
    // Note: protobufjs already includes package in the structure, so start with empty prefix
    if (root) {
      this.walkNamespace(root, '', messages, enums, services);
    }

    return {
      uri,
      content,
      syntax,
      package: packageName,
      imports,
      messages,
      enums,
      services,
      options: [],
      lastModified: Date.now(),
      parseErrors,
    };
  }

  /**
   * Extract syntax version from content
   */
  private extractSyntax(content: string): 'proto2' | 'proto3' {
    const syntaxMatch = content.match(/syntax\s*=\s*"(proto[23])"/);
    return syntaxMatch?.[1] === 'proto2' ? 'proto2' : 'proto3';
  }

  /**
   * Extract package name from content
   */
  private extractPackage(content: string): string | null {
    const packageMatch = content.match(/package\s+([\w.]+)\s*;/);
    return packageMatch?.[1] || null;
  }

  /**
   * Extract imports from content
   */
  private extractImports(content: string): Import[] {
    const imports: Import[] = [];
    const importRegex = /import\s+(public|weak)?\s*"([^"]+)"\s*;/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        path: match[2],
        modifier: match[1] as 'public' | 'weak' | null || null,
        resolved: false,
        resolvedUri: null,
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
      });
    }

    return imports;
  }

  /**
   * Walk through a namespace and extract definitions
   */
  private walkNamespace(
    ns: protobuf.Namespace,
    packagePrefix: string,
    messages: MessageDefinition[],
    enums: EnumDefinition[],
    services: ServiceDefinition[]
  ): void {
    for (const [name, nested] of Object.entries(ns.nested || {})) {
      const fqn = packagePrefix ? `${packagePrefix}.${name}` : name;

      if (nested instanceof protobuf.Type) {
        // It's a message
        messages.push(this.convertMessage(nested, fqn));
      } else if (nested instanceof protobuf.Enum) {
        // It's an enum
        enums.push(this.convertEnum(nested, fqn));
      } else if (nested instanceof protobuf.Service) {
        // It's a service
        services.push(this.convertService(nested, fqn));
      } else if (nested instanceof protobuf.Namespace) {
        // Recursively walk nested namespace
        this.walkNamespace(nested, fqn, messages, enums, services);
      }
    }
  }

  /**
   * Convert protobufjs Type to MessageDefinition
   */
  private convertMessage(type: protobuf.Type, fqn: string): MessageDefinition {
    const fields: Field[] = [];
    const nestedMessages: MessageDefinition[] = [];
    const nestedEnums: EnumDefinition[] = [];

    // Extract fields
    for (const field of type.fieldsArray) {
      fields.push(this.convertField(field));
    }

    // Extract nested types
    if (type.nested) {
      for (const [name, nested] of Object.entries(type.nested)) {
        const nestedFqn = `${fqn}.${name}`;
        if (nested instanceof protobuf.Type) {
          nestedMessages.push(this.convertMessage(nested, nestedFqn));
        } else if (nested instanceof protobuf.Enum) {
          nestedEnums.push(this.convertEnum(nested, nestedFqn));
        }
      }
    }

    return {
      name: type.name,
      fullyQualifiedName: fqn,
      fields,
      nestedMessages,
      nestedEnums,
      options: [],
      location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
      documentation: type.comment || null,
    };
  }

  /**
   * Convert protobufjs Field to Field
   */
  private convertField(field: protobuf.Field): Field {
    return {
      name: field.name,
      type: this.convertFieldType(field),
      number: field.id,
      label: field.repeated ? 'repeated' : field.required ? 'required' : field.optional ? 'optional' : null,
      defaultValue: null,
      options: [],
      location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
      documentation: field.comment || null,
    };
  }

  /**
   * Convert field type to FieldType
   */
  private convertFieldType(field: protobuf.Field): FieldType {
    const type = field.type;

    // Check if it's a primitive type
    const primitiveTypes = [
      'double', 'float', 'int32', 'int64', 'uint32', 'uint64',
      'sint32', 'sint64', 'fixed32', 'fixed64', 'sfixed32', 'sfixed64',
      'bool', 'string', 'bytes',
    ];

    if (primitiveTypes.includes(type)) {
      return { kind: 'primitive', type: type as any };
    }

    // Otherwise, it's a message or enum type
    return { kind: 'message', typeName: type };
  }

  /**
   * Convert protobufjs Enum to EnumDefinition
   */
  private convertEnum(enumType: protobuf.Enum, fqn: string): EnumDefinition {
    const values: EnumValue[] = [];

    for (const [name, id] of Object.entries(enumType.values)) {
      values.push({
        name,
        number: id,
        options: [],
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
        documentation: null,
      });
    }

    return {
      name: enumType.name,
      fullyQualifiedName: fqn,
      values,
      options: [],
      location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
      documentation: enumType.comment || null,
    };
  }

  /**
   * Convert protobufjs Service to ServiceDefinition
   */
  private convertService(service: protobuf.Service, fqn: string): ServiceDefinition {
    const methods: RpcMethod[] = [];

    for (const method of service.methodsArray) {
      methods.push({
        name: method.name,
        inputType: method.requestType,
        outputType: method.responseType,
        clientStreaming: method.requestStream || false,
        serverStreaming: method.responseStream || false,
        options: [],
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
        documentation: method.comment || null,
      });
    }

    return {
      name: service.name,
      fullyQualifiedName: fqn,
      methods,
      options: [],
      location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
      documentation: service.comment || null,
    };
  }
}
