/**
 * Type definitions for Protocol Buffer VSCode Extension
 * Based on data-model.md
 */

/**
 * Location in source code
 */
export interface Location {
  line: number;        // Zero-indexed line number
  column: number;      // Zero-indexed column number
  endLine: number;     // End line number
  endColumn: number;   // End column number
}

/**
 * Parse error
 */
export interface ParseError {
  message: string;
  location: Location;
  severity: 'error' | 'warning';
  code: string;
}

/**
 * Proto option
 */
export interface Option {
  name: string;
  value: any;
  location: Location;
}

/**
 * Field type variants
 */
export type PrimitiveType =
  | 'double' | 'float'
  | 'int32' | 'int64' | 'uint32' | 'uint64'
  | 'sint32' | 'sint64' | 'fixed32' | 'fixed64'
  | 'sfixed32' | 'sfixed64'
  | 'bool' | 'string' | 'bytes';

export type FieldType =
  | { kind: 'primitive'; type: PrimitiveType }
  | { kind: 'message'; typeName: string }
  | { kind: 'enum'; typeName: string }
  | { kind: 'map'; keyType: PrimitiveType; valueType: FieldType };

/**
 * Field in a message
 */
export interface Field {
  name: string;
  type: FieldType;
  number: number;
  label: 'optional' | 'required' | 'repeated' | null;
  defaultValue: any | null;
  options: Option[];
  location: Location;
  documentation: string | null;
}

/**
 * Enum value
 */
export interface EnumValue {
  name: string;
  number: number;
  options: Option[];
  location: Location;
  documentation: string | null;
}

/**
 * Enum definition
 */
export interface EnumDefinition {
  name: string;
  fullyQualifiedName: string;
  values: EnumValue[];
  options: Option[];
  location: Location;
  documentation: string | null;
}

/**
 * Message definition
 */
export interface MessageDefinition {
  name: string;
  fullyQualifiedName: string;
  fields: Field[];
  nestedMessages: MessageDefinition[];
  nestedEnums: EnumDefinition[];
  options: Option[];
  location: Location;
  documentation: string | null;
}

/**
 * RPC method
 */
export interface RpcMethod {
  name: string;
  inputType: string;
  outputType: string;
  clientStreaming: boolean;
  serverStreaming: boolean;
  options: Option[];
  location: Location;
  documentation: string | null;
}

/**
 * Service definition
 */
export interface ServiceDefinition {
  name: string;
  fullyQualifiedName: string;
  methods: RpcMethod[];
  options: Option[];
  location: Location;
  documentation: string | null;
}

/**
 * Import statement
 */
export interface Import {
  path: string;
  modifier: 'public' | 'weak' | null;
  resolved: boolean;
  resolvedUri: string | null;
  location: Location;
}

/**
 * Proto file representation
 */
export interface ProtoFile {
  uri: string;
  content: string;
  syntax: 'proto2' | 'proto3';
  package: string | null;
  imports: Import[];
  messages: MessageDefinition[];
  enums: EnumDefinition[];
  services: ServiceDefinition[];
  options: Option[];
  lastModified: number;
  parseErrors: ParseError[];
}
