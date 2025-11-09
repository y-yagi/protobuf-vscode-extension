/**
 * Mock VSCode API for unit testing
 * This allows us to test code that uses the VSCode API without running in VSCode
 */

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export class Range {
  constructor(
    public startLine: number,
    public startCharacter: number,
    public endLine: number,
    public endCharacter: number
  ) {}
}

export class Diagnostic {
  constructor(
    public range: Range,
    public message: string,
    public severity?: DiagnosticSeverity
  ) {}
  source?: string;
  code?: string | number;
}

export class Uri {
  constructor(public scheme: string, public path: string) {}

  static file(path: string): Uri {
    return new Uri('file', path);
  }

  static parse(value: string): Uri {
    const match = value.match(/^(\w+):\/\/(.+)$/);
    if (match) {
      return new Uri(match[1], match[2]);
    }
    return new Uri('file', value);
  }

  toString(): string {
    return `${this.scheme}://${this.path}`;
  }
}

export interface TextDocument {
  uri: Uri;
  fileName: string;
  languageId: string;
  version: number;
  getText(): string;
  lineAt(line: number): { text: string };
}

export interface DiagnosticCollection {
  set(uri: Uri, diagnostics: Diagnostic[]): void;
  delete(uri: Uri): void;
  clear(): void;
  dispose(): void;
}

export const languages = {
  createDiagnosticCollection: (name: string): DiagnosticCollection => {
    const diagnostics = new Map<string, Diagnostic[]>();
    return {
      set: (uri: Uri, diags: Diagnostic[]) => {
        diagnostics.set(uri.toString(), diags);
      },
      delete: (uri: Uri) => {
        diagnostics.delete(uri.toString());
      },
      clear: () => {
        diagnostics.clear();
      },
      dispose: () => {
        diagnostics.clear();
      },
    };
  },
};

export const workspace = {
  getConfiguration: (section?: string) => {
    return {
      get: <T>(key: string, defaultValue?: T): T => {
        return defaultValue as T;
      },
    };
  },
  textDocuments: [] as TextDocument[],
  onDidChangeTextDocument: jest.fn(),
  onDidOpenTextDocument: jest.fn(),
  onDidCloseTextDocument: jest.fn(),
  createFileSystemWatcher: jest.fn(() => ({
    onDidCreate: jest.fn(),
    onDidChange: jest.fn(),
    onDidDelete: jest.fn(),
    dispose: jest.fn(),
  })),
};

export interface ExtensionContext {
  subscriptions: Array<{ dispose(): any }>;
  workspaceState: any;
  globalState: any;
  extensionPath: string;
}

export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
};

// Export everything that VSCode would export
export default {
  languages,
  workspace,
  window,
  Uri,
  Range,
  Diagnostic,
  DiagnosticSeverity,
};
