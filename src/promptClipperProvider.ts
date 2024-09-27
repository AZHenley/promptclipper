// promptClipperProvider.ts

import * as vscode from 'vscode';

/**
 * A TreeItem that includes a checkbox and a unique identifier.
 */
export class CheckableTreeItem extends vscode.TreeItem {
    public checked: boolean;
    public range: vscode.Range;
    public uniqueId: string;

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        range: vscode.Range,
        checked: boolean = false
    ) {
        super(label, collapsibleState);
        this.checked = checked;
        this.range = range;

        // Assign a uniqueId based on label and start position
        this.uniqueId = `${label}:${range.start.line}:${range.start.character}`;

        // Initialize the checkbox state
        this.updateCheckboxState();

        // Associate the toggleSelection command with this TreeItem
        this.command = {
            command: 'promptclipper.toggleSelection',
            title: 'Toggle Selection',
            arguments: [this]
        };

        // Optional: Set contextValue if you plan to add context-specific actions
        this.contextValue = 'checkable';
    }

    /**
     * Updates the checkbox state based on the 'checked' property.
     */
    public updateCheckboxState(): void {
        this.checkboxState = this.checked
            ? vscode.TreeItemCheckboxState.Checked
            : vscode.TreeItemCheckboxState.Unchecked;
        console.log(`Item "${this.label}" checkbox state updated to ${this.checked ? 'checked' : 'unchecked'}`);
        console.log("**UPDATE**");
    }
}

/**
 * TreeDataProvider for the PromptClipper extension.
 */
export class PromptClipperProvider implements vscode.TreeDataProvider<CheckableTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CheckableTreeItem | undefined | null | void> = new vscode.EventEmitter<CheckableTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CheckableTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private items: CheckableTreeItem[] = [];
    private disposables: vscode.Disposable[] = [];

    constructor() {
        console.log('PromptClipperProvider constructor called');

        // Listen to editor and document changes to refresh the tree view
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                console.log('Active text editor changed');
                this.refresh();
            }),
            vscode.workspace.onDidChangeTextDocument(() => {
                console.log('Text document changed');
                this.refresh();
            })
        );

        // Initial population of items
        this.refresh();
    }

    /**
     * Refreshes the tree view by fetching new items.
     */
    public refresh(): void {
        console.log('Refresh method called');
        this.fetchItems();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Fetches items (classes, functions, methods) from the active editor.
     */
    private fetchItems(): void {
        console.log('fetchItems method called');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const text = document.getText();
            const regex = /(?:class|def)\s+(\w+)(?:\(.*?\))?:/g;
            const newItems: CheckableTreeItem[] = [];
            let match: RegExpExecArray | null;

            while ((match = regex.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);
                const uniqueId = `${match[1]}:${startPos.line}:${startPos.character}`; // include label for uniqueness

                // Find existing item by uniqueId to preserve the checked state
                const existingItem = this.items.find(item => item.uniqueId === uniqueId);
                const isChecked = existingItem ? existingItem.checked : false;

                const newItem = new CheckableTreeItem(
                    match[1],
                    vscode.TreeItemCollapsibleState.None,
                    range,
                    isChecked
                );

                newItems.push(newItem);
                console.log(`Added item: "${newItem.label}", checked: ${newItem.checked}, uniqueId: ${newItem.uniqueId}`);
            }

            this.items = newItems;
            console.log(`Total items after refresh: ${this.items.length}`);
        } else {
            this.items = [];
            console.log('No active editor, items cleared');
        }
    }

    /**
     * Returns the TreeItem representation of an element.
     * @param element The element for which to get the TreeItem.
     */
    public getTreeItem(element: CheckableTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Returns the children of a given element.
     * @param element The parent element.
     */
    public getChildren(element?: CheckableTreeItem): Thenable<CheckableTreeItem[]> {
        console.log(`getChildren called, returning ${this.items.length} items`);
        if (element) {
            return Promise.resolve([]); // No children since all items are leaf nodes
        } else {
            return Promise.resolve(this.items);
        }
    }

    /**
     * Toggles the selection (checked state) of a given item.
     * @param item The item to toggle.
     */
    public toggleSelection(item: CheckableTreeItem): void {
        console.log(`Toggle selection command invoked for item: "${item.label}", uniqueId: ${item.uniqueId}`);

        const treeItem = this.items.find(i => i.uniqueId === item.uniqueId);
        if (treeItem) {
            treeItem.checked = !treeItem.checked;
            treeItem.updateCheckboxState();
            this._onDidChangeTreeData.fire(treeItem);
            console.log(`Item "${treeItem.label}" is now ${treeItem.checked ? 'checked' : 'unchecked'}`);
        } else {
            console.log(`Item "${item.label}" with uniqueId "${item.uniqueId}" not found in items list`);
        }
    }

    /**
     * Copies the selected (checked) items' code to the clipboard.
     */
    public copySelectedToClipboard(): void {
        console.log('copySelectedToClipboard method called');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selectedItems = this.items.filter(item => item.checked);
            console.log(`Found ${selectedItems.length} checked items`);

            const selectedText = selectedItems
                .map(item => {
                    const text = document.getText(item.range);
                    const preview = text.length > 20 ? `${text.substring(0, 20)}...` : text;
                    console.log(`Copying text for "${item.label}": ${preview}`);
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

    /**
     * Disposes of any resources held by the provider.
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
