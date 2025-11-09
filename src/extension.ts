import * as vscode from 'vscode';
import { ProtoParser } from './parser/protoParser';
import { SymbolTable } from './parser/symbolTable';
import { Debouncer } from './parser/debouncer';

// Global instances
let symbolTable: SymbolTable;
let parser: ProtoParser;
let debouncer: Debouncer;
let diagnosticCollection: vscode.DiagnosticCollection;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Protocol Buffers extension is now active');

  // Initialize global instances
  symbolTable = new SymbolTable();
  parser = new ProtoParser();
  debouncer = new Debouncer();

  // Create diagnostic collection for error reporting
  diagnosticCollection = vscode.languages.createDiagnosticCollection('proto');
  context.subscriptions.push(diagnosticCollection);

  // Register the proto language
  // The language configuration is handled by package.json contributes.languages

  // Parse all open proto files on activation
  vscode.workspace.textDocuments.forEach((document) => {
    if (document.languageId === 'proto') {
      parseDocument(document);
    }
  });

  // Watch for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'proto') {
        // Debounce parsing to avoid excessive work during typing
        const config = vscode.workspace.getConfiguration('proto');
        const debounceMs = config.get<number>('validation.debounceMs', 300);

        debouncer.debounce(() => {
          parseDocument(event.document);
        }, debounceMs);
      }
    })
  );

  // Watch for document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'proto') {
        parseDocument(document);
      }
    })
  );

  // Watch for document close
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === 'proto') {
        symbolTable.removeFile(document.uri.toString());
        diagnosticCollection.delete(document.uri);
      }
    })
  );

  // Watch for file system changes (create, delete, rename)
  const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.proto');

  context.subscriptions.push(
    fileWatcher.onDidCreate((uri) => {
      // Parse new proto file
      vscode.workspace.openTextDocument(uri).then((document) => {
        parseDocument(document);
      });
    })
  );

  context.subscriptions.push(
    fileWatcher.onDidDelete((uri) => {
      // Remove from symbol table
      symbolTable.removeFile(uri.toString());
      diagnosticCollection.delete(uri);
    })
  );

  context.subscriptions.push(fileWatcher);

  return {
    // Export API for other extensions or testing
    getSymbolTable: () => symbolTable,
    getParser: () => parser,
  };
}

/**
 * Parse a document and update symbol table
 */
function parseDocument(document: vscode.TextDocument): void {
  const config = vscode.workspace.getConfiguration('proto');
  const validationEnabled = config.get<boolean>('validation.enabled', true);

  if (!validationEnabled) {
    return;
  }

  try {
    const content = document.getText();
    const uri = document.uri.toString();

    // Parse the proto file
    const protoFile = parser.parse(content, uri);

    // Update symbol table
    symbolTable.addFile(protoFile);

    // Update diagnostics
    updateDiagnostics(document, protoFile);
  } catch (error) {
    console.error('Error parsing proto file:', error);
  }
}

/**
 * Update diagnostics for a document
 */
function updateDiagnostics(
  document: vscode.TextDocument,
  protoFile: { parseErrors: Array<{ message: string; location: { line: number; column: number }; severity: 'error' | 'warning' }> }
): void {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const error of protoFile.parseErrors) {
    const range = new vscode.Range(
      error.location.line,
      error.location.column,
      error.location.line,
      error.location.column + 1
    );

    const severity =
      error.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning;

    const diagnostic = new vscode.Diagnostic(range, error.message, severity);
    diagnostic.source = 'protobuf';
    diagnostics.push(diagnostic);
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  if (symbolTable) {
    symbolTable.clear();
  }
  if (debouncer) {
    debouncer.cancel();
  }
  if (diagnosticCollection) {
    diagnosticCollection.clear();
    diagnosticCollection.dispose();
  }
}
