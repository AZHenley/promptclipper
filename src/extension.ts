// src/extension.ts

import * as vscode from 'vscode';
import { PromptClipperProvider } from './promptClipperProvider';
import { PromptClipperSymbolProvider } from './symbolProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating PromptClipper extension');

    const promptClipperProvider = new PromptClipperProvider();
    vscode.window.registerTreeDataProvider('promptclipperExplorer', promptClipperProvider);

    // Register Symbol Provider
    const symbolProvider = new PromptClipperSymbolProvider();
    const languages = ['javascript', 'typescript', 'python', 'java']; // Add other supported languages here
    languages.forEach(language => {
        context.subscriptions.push(
            vscode.languages.registerDocumentSymbolProvider({ language }, symbolProvider)
        );
    });

    // Register Commands
    let refreshCommand = vscode.commands.registerCommand('promptclipper.refreshEntry', () => {
        console.log('Refresh command executed');
        promptClipperProvider.refresh();
    });

    let copySelectedCommand = vscode.commands.registerCommand('promptclipper.copySelected', () => {
        console.log('Copy Selected command executed');
        promptClipperProvider.copySelectedToClipboard();
    });

    let toggleSelectionCommand = vscode.commands.registerCommand('promptclipper.toggleSelection', (id: string) => {
        console.log(`Toggle Selection command received for id: "${id}"`);
        promptClipperProvider.toggleSelection(id);
    });

    context.subscriptions.push(refreshCommand, copySelectedCommand, toggleSelectionCommand);
}

export function deactivate() {
    console.log('Deactivating PromptClipper extension');
}
