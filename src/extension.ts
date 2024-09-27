// extension.ts

import * as vscode from 'vscode';
import { PromptClipperProvider, CheckableTreeItem } from './promptClipperProvider';

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
    let toggleSelectionCommand = vscode.commands.registerCommand('promptclipper.toggleSelection', (item: CheckableTreeItem) => {
        console.log(`Toggle Selection command received for item: "${item.label}", uniqueId: ${item.uniqueId}`);
        promptClipperProvider.toggleSelection(item);
    });

    vscode.commands.registerCommand('promptclipper.toggleSelection', (item: CheckableTreeItem) => {
        console.log(`Global listener: Toggle Selection for "${item.label}", id: ${item.id}`);
        promptClipperProvider.toggleSelection(item);
    });

    context.subscriptions.push(refreshCommand, copySelectedCommand, toggleSelectionCommand);
}

export function deactivate() {
    console.log('Deactivating PromptClipper extension');
}
