// src/symbolProvider.ts

import * as vscode from 'vscode';

/**
 * Implements a DocumentSymbolProvider to extract classes, functions, and methods.
 */
export class PromptClipperSymbolProvider implements vscode.DocumentSymbolProvider {
    /**
     * Provides symbols for the given document.
     * @param document The text document to provide symbols for.
     * @param token A cancellation token.
     * @returns An array of DocumentSymbol objects.
     */
    public async provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.SymbolInformation[]> {
        const symbols: vscode.SymbolInformation[] = [];

        // Get all symbols from the document
        const documentSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeDocumentSymbolProvider',
            document.uri
        );

        if (documentSymbols) {
            symbols.push(...documentSymbols);
        }

        return symbols;
    }
}
