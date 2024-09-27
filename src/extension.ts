import * as vscode from 'vscode';
import { PromptClipperProvider } from './promptClipperProvider';

export function activate(context: vscode.ExtensionContext) {
    const promptClipperProvider = new PromptClipperProvider();
    vscode.window.registerTreeDataProvider('promptclipperExplorer', promptClipperProvider);

    let refreshCommand = vscode.commands.registerCommand('promptclipper.refreshEntry', () => {
        promptClipperProvider.refresh();
    });

    let copySelectedCommand = vscode.commands.registerCommand('promptclipper.copySelected', () => {
        promptClipperProvider.copySelectedToClipboard();
    });

    context.subscriptions.push(refreshCommand, copySelectedCommand);
}

export function deactivate() {}