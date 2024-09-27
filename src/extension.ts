// src/extension.ts

import * as vscode from 'vscode';
import { PromptClipperProvider } from './promptClipperProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating PromptClipper extension');

    const promptClipperProvider = new PromptClipperProvider();
    vscode.window.registerTreeDataProvider('promptclipperExplorer', promptClipperProvider);

    // Register Refresh Command
    let refreshCommand = vscode.commands.registerCommand('promptclipper.refreshEntry', () => {
        console.log('Refresh command executed');
        promptClipperProvider.refresh();
    });

    // Register Copy Selected Command
    let copySelectedCommand = vscode.commands.registerCommand('promptclipper.copySelected', () => {
        console.log('Copy Selected command executed');
        promptClipperProvider.copySelectedToClipboard();
    });

    // Register Toggle Selection Command
    let toggleSelectionCommand = vscode.commands.registerCommand('promptclipper.toggleSelection', (id: string) => {
        console.log(`Toggle Selection command received for id: "${id}"`);
        promptClipperProvider.toggleSelection(id);
    });

    context.subscriptions.push(refreshCommand, copySelectedCommand, toggleSelectionCommand);
}

export function deactivate() {
    console.log('Deactivating PromptClipper extension');
}
