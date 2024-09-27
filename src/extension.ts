import * as vscode from 'vscode';
import { PromptClipperProvider, CheckableTreeItem } from './promptClipperProvider'; // Imported CheckableTreeItem

export function activate(context: vscode.ExtensionContext) {
    const promptClipperProvider = new PromptClipperProvider();
    vscode.window.registerTreeDataProvider('promptclipperExplorer', promptClipperProvider);

    let refreshCommand = vscode.commands.registerCommand('promptclipper.refreshEntry', () => {
        promptClipperProvider.refresh();
    });

    let copySelectedCommand = vscode.commands.registerCommand('promptclipper.copySelected', () => {
        promptClipperProvider.copySelectedToClipboard();
    });

    let toggleSelectionCommand = vscode.commands.registerCommand('promptclipper.toggleSelection', (item: CheckableTreeItem) => { // Added type
        promptClipperProvider.toggleSelection(item);
    });

    context.subscriptions.push(refreshCommand, copySelectedCommand, toggleSelectionCommand);
}

export function deactivate() {}
