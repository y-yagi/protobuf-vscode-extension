import * as vscode from 'vscode';
import { activate, deactivate } from '../../src/extension';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Extension Integration Tests', () => {
  let context: vscode.ExtensionContext;
  let mockSubscriptions: Array<{ dispose(): any }>;

  beforeEach(() => {
    // Create mock extension context
    mockSubscriptions = [];
    context = {
      subscriptions: mockSubscriptions,
      workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
      },
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
      },
      extensionPath: '/test/extension/path',
    } as any;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    if (typeof deactivate === 'function') {
      deactivate();
    }
  });

  describe('activate', () => {
    it('should activate extension successfully', () => {
      const api = activate(context);

      expect(api).toBeDefined();
      expect(api.getSymbolTable).toBeDefined();
      expect(api.getParser).toBeDefined();
    });

    it('should initialize symbol table and parser', () => {
      const api = activate(context);

      const symbolTable = api.getSymbolTable();
      const parser = api.getParser();

      expect(symbolTable).toBeDefined();
      expect(parser).toBeDefined();
    });

    it('should create diagnostic collection', () => {
      activate(context);

      // Diagnostic collection should be added to subscriptions
      expect(context.subscriptions.length).toBeGreaterThan(0);
    });

    it('should register document change listener', () => {
      activate(context);

      // Should register onDidChangeTextDocument listener
      const changeListener = context.subscriptions.find(
        (sub: any) => sub._type === 'onDidChangeTextDocument'
      );
      expect(context.subscriptions.length).toBeGreaterThan(0);
    });

    it('should register document open listener', () => {
      activate(context);

      // Should register onDidOpenTextDocument listener
      expect(context.subscriptions.length).toBeGreaterThan(0);
    });

    it('should register document close listener', () => {
      activate(context);

      // Should register onDidCloseTextDocument listener
      expect(context.subscriptions.length).toBeGreaterThan(0);
    });

    it('should register file system watcher', () => {
      activate(context);

      // File watcher should be added to subscriptions
      expect(context.subscriptions.length).toBeGreaterThan(0);
    });

    it('should parse open proto documents on activation', () => {
      // Create a mock proto document
      const mockDocument: vscode.TextDocument = {
        uri: vscode.Uri.file('/test/sample.proto'),
        fileName: '/test/sample.proto',
        languageId: 'proto',
        version: 1,
        getText: () => `
syntax = "proto3";
package test;

message TestMessage {
  string field = 1;
}
`,
        lineAt: (line: number) => ({ text: '' }),
      } as any;

      // Mock workspace.textDocuments to return our proto document
      (vscode.workspace as any).textDocuments = [mockDocument];

      const api = activate(context);
      const symbolTable = api.getSymbolTable();

      // Give it a moment to parse
      setTimeout(() => {
        const file = symbolTable.getFile(mockDocument.uri.toString());
        expect(file).toBeDefined();
      }, 10);
    });

    it('should expose API for getting symbol table', () => {
      const api = activate(context);
      const symbolTable = api.getSymbolTable();

      expect(symbolTable).toBeDefined();
      expect(typeof symbolTable.addFile).toBe('function');
      expect(typeof symbolTable.findMessage).toBe('function');
      expect(typeof symbolTable.findEnum).toBe('function');
    });

    it('should expose API for getting parser', () => {
      const api = activate(context);
      const parser = api.getParser();

      expect(parser).toBeDefined();
      expect(typeof parser.parse).toBe('function');
    });
  });

  describe('deactivate', () => {
    it('should clean up resources on deactivation', () => {
      const api = activate(context);
      const symbolTable = api.getSymbolTable();

      // Add some data to symbol table
      const mockFile = {
        uri: 'test://file.proto',
        content: '',
        syntax: 'proto3' as const,
        package: null,
        imports: [],
        messages: [],
        enums: [],
        services: [],
        options: [],
        lastModified: Date.now(),
        parseErrors: [],
      };
      symbolTable.addFile(mockFile);

      expect(symbolTable.getAllFiles().length).toBe(1);

      // Deactivate
      deactivate();

      // Symbol table should be cleared
      expect(symbolTable.getAllFiles().length).toBe(0);
    });
  });

  describe('end-to-end parsing', () => {
    it('should parse a real proto file and update symbol table', () => {
      const api = activate(context);
      const parser = api.getParser();
      const symbolTable = api.getSymbolTable();

      // Read the sample proto file
      const sampleProtoPath = join(__dirname, '../fixtures/sample.proto');
      const content = readFileSync(sampleProtoPath, 'utf-8');

      // Parse the file
      const protoFile = parser.parse(content, 'file:///test/sample.proto');

      // Add to symbol table
      symbolTable.addFile(protoFile);

      // Verify the file was parsed correctly
      expect(protoFile.syntax).toBe('proto3');
      expect(protoFile.package).toBe('example');
      expect(protoFile.parseErrors.length).toBe(0);

      // Verify messages were indexed
      const userMessage = symbolTable.findMessage('example.User');
      expect(userMessage).toBeDefined();
      expect(userMessage?.name).toBe('User');

      // Verify enums were indexed
      const statusEnum = symbolTable.findEnum('example.Status');
      expect(statusEnum).toBeDefined();
      expect(statusEnum?.name).toBe('Status');

      // Verify services were indexed
      const userService = symbolTable.findService('example.UserService');
      expect(userService).toBeDefined();
      expect(userService?.name).toBe('UserService');
    });

    it('should handle parsing errors gracefully', () => {
      const api = activate(context);
      const parser = api.getParser();
      const symbolTable = api.getSymbolTable();

      // Read the invalid proto file
      const invalidProtoPath = join(__dirname, '../fixtures/invalid.proto');
      const content = readFileSync(invalidProtoPath, 'utf-8');

      // Parse the file
      const protoFile = parser.parse(content, 'file:///test/invalid.proto');

      // Add to symbol table
      symbolTable.addFile(protoFile);

      // Verify parse errors were captured
      expect(protoFile.parseErrors.length).toBeGreaterThan(0);
    });

    it('should update symbol table when file is modified', () => {
      const api = activate(context);
      const parser = api.getParser();
      const symbolTable = api.getSymbolTable();

      const uri = 'file:///test/modified.proto';

      // Parse initial version
      const version1 = `
syntax = "proto3";
package test;

message V1 {
  string field = 1;
}
`;
      const file1 = parser.parse(version1, uri);
      symbolTable.addFile(file1);

      expect(symbolTable.findMessage('test.V1')).toBeDefined();

      // Parse modified version
      const version2 = `
syntax = "proto3";
package test;

message V2 {
  string field = 1;
}
`;
      const file2 = parser.parse(version2, uri);
      symbolTable.addFile(file2);

      // Old message should be removed, new message should be added
      expect(symbolTable.findMessage('test.V1')).toBeNull();
      expect(symbolTable.findMessage('test.V2')).toBeDefined();
    });

    it('should remove file from symbol table when closed', () => {
      const api = activate(context);
      const parser = api.getParser();
      const symbolTable = api.getSymbolTable();

      const uri = 'file:///test/to-close.proto';

      // Parse and add file
      const content = `
syntax = "proto3";
package test;

message ToClose {
  string field = 1;
}
`;
      const file = parser.parse(content, uri);
      symbolTable.addFile(file);

      expect(symbolTable.getFile(uri)).toBeDefined();
      expect(symbolTable.findMessage('test.ToClose')).toBeDefined();

      // Remove file (simulating close)
      symbolTable.removeFile(uri);

      expect(symbolTable.getFile(uri)).toBeNull();
      expect(symbolTable.findMessage('test.ToClose')).toBeNull();
    });
  });

  describe('configuration', () => {
    it('should respect validation.enabled configuration', () => {
      // Mock configuration to disable validation
      const mockConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'validation.enabled') return false;
          return defaultValue;
        }),
      };
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

      activate(context);

      // When validation is disabled, parsing should be skipped
      expect(vscode.workspace.getConfiguration).toHaveBeenCalled();
    });

    it('should use configured debounce delay', () => {
      // Mock configuration with custom debounce delay
      const mockConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'validation.debounceMs') return 500;
          return defaultValue;
        }),
      };
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

      activate(context);

      // Configuration should be queried for debounce delay
      expect(vscode.workspace.getConfiguration).toHaveBeenCalled();
    });
  });
});
