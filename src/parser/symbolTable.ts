import { ProtoFile, MessageDefinition, EnumDefinition, ServiceDefinition } from '../types';

/**
 * SymbolTable - In-memory cache of all parsed proto definitions
 * Provides fast lookup of messages, enums, and services by fully qualified name
 */
export class SymbolTable {
  private files: Map<string, ProtoFile> = new Map();
  private messagesByFQN: Map<string, MessageDefinition> = new Map();
  private enumsByFQN: Map<string, EnumDefinition> = new Map();
  private servicesByFQN: Map<string, ServiceDefinition> = new Map();

  /**
   * Add or update a parsed proto file in the symbol table
   */
  addFile(file: ProtoFile): void {
    // Remove old file if it exists (to clean up old symbols)
    if (this.files.has(file.uri)) {
      this.removeFile(file.uri);
    }

    // Add file
    this.files.set(file.uri, file);

    // Index messages
    this.indexMessages(file.messages);

    // Index enums
    for (const enumDef of file.enums) {
      this.enumsByFQN.set(enumDef.fullyQualifiedName, enumDef);
    }

    // Index services
    for (const service of file.services) {
      this.servicesByFQN.set(service.fullyQualifiedName, service);
    }
  }

  /**
   * Recursively index messages and their nested messages/enums
   */
  private indexMessages(messages: MessageDefinition[]): void {
    for (const message of messages) {
      this.messagesByFQN.set(message.fullyQualifiedName, message);

      // Index nested messages recursively
      if (message.nestedMessages.length > 0) {
        this.indexMessages(message.nestedMessages);
      }

      // Index nested enums
      for (const nestedEnum of message.nestedEnums) {
        this.enumsByFQN.set(nestedEnum.fullyQualifiedName, nestedEnum);
      }
    }
  }

  /**
   * Remove a file and all its symbols from the symbol table
   */
  removeFile(uri: string): void {
    const file = this.files.get(uri);
    if (!file) {
      return;
    }

    // Remove messages
    this.removeMessages(file.messages);

    // Remove enums
    for (const enumDef of file.enums) {
      this.enumsByFQN.delete(enumDef.fullyQualifiedName);
    }

    // Remove services
    for (const service of file.services) {
      this.servicesByFQN.delete(service.fullyQualifiedName);
    }

    // Remove file
    this.files.delete(uri);
  }

  /**
   * Recursively remove messages and their nested messages/enums
   */
  private removeMessages(messages: MessageDefinition[]): void {
    for (const message of messages) {
      this.messagesByFQN.delete(message.fullyQualifiedName);

      // Remove nested messages recursively
      if (message.nestedMessages.length > 0) {
        this.removeMessages(message.nestedMessages);
      }

      // Remove nested enums
      for (const nestedEnum of message.nestedEnums) {
        this.enumsByFQN.delete(nestedEnum.fullyQualifiedName);
      }
    }
  }

  /**
   * Get a proto file by URI
   */
  getFile(uri: string): ProtoFile | null {
    return this.files.get(uri) || null;
  }

  /**
   * Find a message by fully qualified name
   */
  findMessage(fqn: string): MessageDefinition | null {
    return this.messagesByFQN.get(fqn) || null;
  }

  /**
   * Find an enum by fully qualified name
   */
  findEnum(fqn: string): EnumDefinition | null {
    return this.enumsByFQN.get(fqn) || null;
  }

  /**
   * Find a service by fully qualified name
   */
  findService(fqn: string): ServiceDefinition | null {
    return this.servicesByFQN.get(fqn) || null;
  }

  /**
   * Get all files in the symbol table
   */
  getAllFiles(): ProtoFile[] {
    return Array.from(this.files.values());
  }

  /**
   * Clear all files and symbols
   */
  clear(): void {
    this.files.clear();
    this.messagesByFQN.clear();
    this.enumsByFQN.clear();
    this.servicesByFQN.clear();
  }

  /**
   * Get statistics about the symbol table
   */
  getStats(): { files: number; messages: number; enums: number; services: number } {
    return {
      files: this.files.size,
      messages: this.messagesByFQN.size,
      enums: this.enumsByFQN.size,
      services: this.servicesByFQN.size,
    };
  }
}
