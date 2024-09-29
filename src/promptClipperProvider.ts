// src/promptClipperProvider.ts

import * as vscode from 'vscode';

/**
 * A TreeItem that includes a checkbox, a unique identifier, symbol kind, and parameters.
 */
export class CheckableTreeItem extends vscode.TreeItem {
    public checked: boolean;
    public range: vscode.Range;
    public symbolKind: vscode.SymbolKind;
    public parameters: string;
    public detail?: string; // Add this line

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        range: vscode.Range,
        symbolKind: vscode.SymbolKind,
        parameters: string = '',
        checked: boolean = false
    ) {
        super(label, collapsibleState);
        this.checked = checked;
        this.range = range;
        this.symbolKind = symbolKind;
        this.parameters = parameters;

        // Assign a unique id based on label and start position
        this.id = `${label}:${range.start.line}:${range.start.character}`;

        // Initialize the checkbox state
        this.updateCheckboxState();

        // Set the icon based on symbol kind
        this.iconPath = this.getIconForSymbolKind(symbolKind);

        // Set the detail to show parameters
        this.detail = parameters;

        // Associate the toggleSelection command with this TreeItem
        this.command = {
            command: 'promptclipper.toggleSelection',
            title: 'Toggle Selection',
            arguments: [this.id] // Pass only the unique id
        };

        // Optional: Set contextValue if you plan to add context-specific actions
        this.contextValue = 'checkable';
    }

    /**
     * Determines the icon based on the symbol kind.
     */
    private getIconForSymbolKind(kind: vscode.SymbolKind): vscode.ThemeIcon {
        switch (kind) {
            case vscode.SymbolKind.Class:
                return new vscode.ThemeIcon('symbol-class');
            case vscode.SymbolKind.Method:
                return new vscode.ThemeIcon('symbol-method');
            case vscode.SymbolKind.Function:
                return new vscode.ThemeIcon('symbol-function');
            default:
                return new vscode.ThemeIcon('symbol-unknown');
        }
    }

    /**
     * Updates the checkbox state based on the 'checked' property.
     */
    public updateCheckboxState(): void {
        this.checkboxState = this.checked
            ? vscode.TreeItemCheckboxState.Checked
            : vscode.TreeItemCheckboxState.Unchecked;
        console.log(`Item "${this.label}" checkbox state updated to ${this.checked ? 'checked' : 'unchecked'}`);
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
     * Fetches items (classes, functions, methods) from the active editor using symbols.
     */
    private async fetchItems(): Promise<void> {
        console.log('fetchItems method called');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            try {
                const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                    'vscode.executeDocumentSymbolProvider',
                    document.uri
                );

                const newItems: CheckableTreeItem[] = [];

                if (symbols) {
                    for (const symbol of symbols) {
                        // Recursively process symbols
                        this.processSymbol(symbol, document, newItems);
                    }
                } else {
                    console.log('No symbols found in the document');
                }

                this.items = newItems;
                console.log(`Total items after refresh: ${this.items.length}`);
            } catch (error) {
                console.error('Error fetching symbols:', error);
                this.items = [];
            }
        } else {
            this.items = [];
            console.log('No active editor, items cleared');
        }
    }

    /**
     * Processes a symbol and adds it to the items array if it matches desired kinds.
     * Also recursively processes children symbols.
     */
    private processSymbol(symbol: vscode.DocumentSymbol, document: vscode.TextDocument, items: CheckableTreeItem[]) {
        // Filter for classes, functions, methods based on symbol kind
        if (
            symbol.kind === vscode.SymbolKind.Class ||
            symbol.kind === vscode.SymbolKind.Function ||
            symbol.kind === vscode.SymbolKind.Method
        ) {
            const label = symbol.name;
            const range = symbol.range;

            // Extract parameters if it's a function or method
            let parameters = '';
            if (symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Method) {
                parameters = this.extractParameters(document, symbol);
            }

            // Assign a unique id based on label and start position
            const uniqueId = `${label}:${range.start.line}:${range.start.character}`;

            // Find existing item by uniqueId to preserve the checked state
            const existingItem = this.items.find(item => item.id === uniqueId);
            const isChecked = existingItem ? existingItem.checked : false;

            const newItem = new CheckableTreeItem(
                label,
                vscode.TreeItemCollapsibleState.None,
                range,
                symbol.kind,
                parameters,
                isChecked
            );

            items.push(newItem);
            console.log(`Added item: "${newItem.label}", checked: ${newItem.checked}, id: ${newItem.id}, parameters: "${newItem.parameters}"`);
        }

        // Recursively process children
        if (symbol.children) {
            for (const child of symbol.children) {
                this.processSymbol(child, document, items);
            }
        }
    }

    /**
     * Extracts parameters from a function or method symbol.
     * This is a simplistic implementation using regex.
     * It might need to be adjusted based on language syntax.
     */
    private extractParameters(document: vscode.TextDocument, symbol: vscode.DocumentSymbol): string {
        try {
            const symbolText = document.getText(symbol.range);
            // Simple regex to extract parameters within parentheses
            const regex = /\(([^)]*)\)/;
            const match = regex.exec(symbolText);
            if (match && match[1]) {
                return match[1].trim();
            }
        } catch (error) {
            console.error(`Error extracting parameters for symbol "${symbol.name}":`, error);
        }
        return '';
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
     * Toggles the selection (checked state) of a given item based on its unique id.
     * @param id The unique id of the item to toggle.
     */
    public toggleSelection(id: string): void {
        console.log(`Toggle selection command invoked for id: "${id}"`);

        const treeItem = this.items.find(i => i.id === id);
        if (treeItem) {
            treeItem.checked = !treeItem.checked;
            treeItem.updateCheckboxState();
            this._onDidChangeTreeData.fire(treeItem);
            console.log(`Item "${treeItem.label}" is now ${treeItem.checked ? 'checked' : 'unchecked'}`);
        } else {
            console.log(`Item with id "${id}" not found in items list`);
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
