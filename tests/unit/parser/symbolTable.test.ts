import { SymbolTable } from '../../../src/parser/symbolTable';
import { ProtoFile } from '../../../src/types';

describe('SymbolTable', () => {
  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable();
  });

  const createMockProtoFile = (uri: string, packageName: string): ProtoFile => ({
    uri,
    content: '',
    syntax: 'proto3',
    package: packageName,
    imports: [],
    messages: [
      {
        name: 'User',
        fullyQualifiedName: `${packageName}.User`,
        fields: [],
        nestedMessages: [],
        nestedEnums: [],
        options: [],
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
        documentation: null,
      },
    ],
    enums: [
      {
        name: 'Status',
        fullyQualifiedName: `${packageName}.Status`,
        values: [],
        options: [],
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
        documentation: null,
      },
    ],
    services: [
      {
        name: 'UserService',
        fullyQualifiedName: `${packageName}.UserService`,
        methods: [],
        options: [],
        location: { line: 0, column: 0, endLine: 0, endColumn: 0 },
        documentation: null,
      },
    ],
    options: [],
    lastModified: Date.now(),
    parseErrors: [],
  });

  describe('addFile', () => {
    it('should add a proto file to the symbol table', () => {
      const file = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file);

      const retrieved = symbolTable.getFile('file:///test.proto');
      expect(retrieved).toBe(file);
    });

    it('should index messages by fully qualified name', () => {
      const file = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file);

      const message = symbolTable.findMessage('test.User');
      expect(message).toBeDefined();
      expect(message?.name).toBe('User');
    });

    it('should index enums by fully qualified name', () => {
      const file = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file);

      const enumDef = symbolTable.findEnum('test.Status');
      expect(enumDef).toBeDefined();
      expect(enumDef?.name).toBe('Status');
    });

    it('should index services by fully qualified name', () => {
      const file = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file);

      const service = symbolTable.findService('test.UserService');
      expect(service).toBeDefined();
      expect(service?.name).toBe('UserService');
    });

    it('should update existing file when added again', () => {
      const file1 = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file1);

      const file2 = createMockProtoFile('file:///test.proto', 'test.v2');
      symbolTable.addFile(file2);

      const retrieved = symbolTable.getFile('file:///test.proto');
      expect(retrieved?.package).toBe('test.v2');
    });
  });

  describe('removeFile', () => {
    it('should remove a file from the symbol table', () => {
      const file = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file);

      symbolTable.removeFile('file:///test.proto');

      const retrieved = symbolTable.getFile('file:///test.proto');
      expect(retrieved).toBeNull();
    });

    it('should remove indexed symbols when file is removed', () => {
      const file = createMockProtoFile('file:///test.proto', 'test');
      symbolTable.addFile(file);

      symbolTable.removeFile('file:///test.proto');

      expect(symbolTable.findMessage('test.User')).toBeNull();
      expect(symbolTable.findEnum('test.Status')).toBeNull();
      expect(symbolTable.findService('test.UserService')).toBeNull();
    });
  });

  describe('findMessage', () => {
    it('should return null for non-existent message', () => {
      const message = symbolTable.findMessage('non.existent.Message');
      expect(message).toBeNull();
    });

    it('should find message from multiple files', () => {
      const file1 = createMockProtoFile('file:///test1.proto', 'pkg1');
      const file2 = createMockProtoFile('file:///test2.proto', 'pkg2');

      symbolTable.addFile(file1);
      symbolTable.addFile(file2);

      expect(symbolTable.findMessage('pkg1.User')).toBeDefined();
      expect(symbolTable.findMessage('pkg2.User')).toBeDefined();
    });
  });

  describe('findEnum', () => {
    it('should return null for non-existent enum', () => {
      const enumDef = symbolTable.findEnum('non.existent.Enum');
      expect(enumDef).toBeNull();
    });
  });

  describe('findService', () => {
    it('should return null for non-existent service', () => {
      const service = symbolTable.findService('non.existent.Service');
      expect(service).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all files and symbols', () => {
      const file1 = createMockProtoFile('file:///test1.proto', 'pkg1');
      const file2 = createMockProtoFile('file:///test2.proto', 'pkg2');

      symbolTable.addFile(file1);
      symbolTable.addFile(file2);

      symbolTable.clear();

      expect(symbolTable.getFile('file:///test1.proto')).toBeNull();
      expect(symbolTable.getFile('file:///test2.proto')).toBeNull();
      expect(symbolTable.findMessage('pkg1.User')).toBeNull();
      expect(symbolTable.findMessage('pkg2.User')).toBeNull();
    });
  });

  describe('getAllFiles', () => {
    it('should return all files in the symbol table', () => {
      const file1 = createMockProtoFile('file:///test1.proto', 'pkg1');
      const file2 = createMockProtoFile('file:///test2.proto', 'pkg2');

      symbolTable.addFile(file1);
      symbolTable.addFile(file2);

      const files = symbolTable.getAllFiles();
      expect(files).toHaveLength(2);
      expect(files).toContain(file1);
      expect(files).toContain(file2);
    });

    it('should return empty array when no files', () => {
      const files = symbolTable.getAllFiles();
      expect(files).toHaveLength(0);
    });
  });
});
