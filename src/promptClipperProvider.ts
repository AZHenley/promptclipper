import * as vscode from 'vscode';

class CheckableTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public checked: boolean = false,
        public readonly range: vscode.Range
    ) {
        super(label, collapsibleState);
        
        // Assign a unique ID based on the start position of the range
        this.id = `${range.start.line}:${range.start.character}`;
        
        this.updateCheckbox();

        // Associate the toggleSelection command with this TreeItem
        this.command = {
            command: 'promptclipper.toggleSelection',
            title: 'Toggle Selection',
            arguments: [this]
        };
    }

    updateCheckbox() {
        this.checkboxState = this.checked
            ? vscode.TreeItemCheckboxState.Checked
            : vscode.TreeItemCheckboxState.Unchecked;
        console.log(`Item "${this.label}" checkbox state updated to ${this.checked ? 'checked' : 'unchecked'}`);
    }
}

export class PromptClipperProvider implements vscode.TreeDataProvider<CheckableTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CheckableTreeItem | undefined | null | void> = new vscode.EventEmitter<CheckableTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CheckableTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private items: CheckableTreeItem[] = [];
    private disposables: vscode.Disposable[] = [];

    constructor() {
        console.log('PromptClipperProvider constructor called');
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                console.log('Active text editor changed');
                this.refresh();
            }),
            vscode.workspace.onDidChangeTextDocument(() => {
                console.log('Text document changed');
                this.refresh();
            }),
            vscode.commands.registerCommand('promptclipper.toggleSelection', (item: CheckableTreeItem) => {
                console.log(`Toggle selection command called for item: "${item.label}"`);
                this.toggleSelection(item);
            }),
            vscode.commands.registerCommand('promptclipper.copySelected', () => {
                console.log('Copy selected command called');
                this.copySelectedToClipboard();
            })
        );
        this.refresh();
    }

    refresh(): void {
        console.log('Refresh method called');
        this.getItems();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CheckableTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CheckableTreeItem): Thenable<CheckableTreeItem[]> {
        console.log(`getChildren called, returning ${this.items.length} items`);
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.items);
        }
    }

    private getItems(): void {
        console.log('getItems method called');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const text = document.getText();
            const regex = /(?:class|def)\s+(\w+)(?:\(.*?\))?:/g;
            const newItems: CheckableTreeItem[] = [];
            let match: RegExpExecArray | null;
            while ((match = regex.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const uniqueId = `${startPos.line}:${startPos.character}`;
                const range = new vscode.Range(
                    startPos,
                    document.positionAt(match.index + match[0].length)
                );
                
                // Find existing item by unique ID to preserve the checked state
                const existingItem = this.items.find(item => item.id === uniqueId);
                
                const newItem = new CheckableTreeItem(
                    match[1], 
                    vscode.TreeItemCollapsibleState.None, 
                    existingItem ? existingItem.checked : false, 
                    range
                );
                newItems.push(newItem);
                console.log(`Added item: "${newItem.label}", checked: ${newItem.checked}`);
            }
            this.items = newItems;
            console.log(`Total items after refresh: ${this.items.length}`);
        } else {
            this.items = [];
            console.log('No active editor, items cleared');
        }
    }

    private toggleSelection(item: CheckableTreeItem): void {
        console.log(`Toggling selection for item: "${item.label}"`);
        const treeItem = this.items.find(i => i.id === item.id);
        if (treeItem) {
            treeItem.checked = !treeItem.checked;
            treeItem.updateCheckbox();
            this._onDidChangeTreeData.fire(treeItem);
            console.log(`Item "${treeItem.label}" is now ${treeItem.checked ? 'checked' : 'unchecked'}`);
        } else {
            console.log(`Item "${item.label}" not found in items list`);
        }
    }

    copySelectedToClipboard(): void {
        console.log('copySelectedToClipboard method called');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selectedItems = this.items.filter(item => item.checked);
            console.log(`Found ${selectedItems.length} checked items`);
            
            const selectedText = selectedItems
                .map(item => {
                    const text = document.getText(item.range);
                    console.log(`Copying text for "${item.label}": ${text.substring(0, Math.min(text.length, 20))}...`);
                    return text;
                })
                .join('\n\n');
            
            if (selectedText) {
                vscode.env.clipboard.writeText(selectedText);
                vscode.window.showInformationMessage('Selected items copied to clipboard');
                console.log('Text copied to clipboard');
            } else {
                vscode.window.showInformationMessage('No items selected to copy');
                console.log('No items selected to copy');
            }
        } else {
            console.log('No active editor when trying to copy');
        }
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
