import * as vscode from 'vscode';

export class ErrorTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string, // The label for the tree item
        public readonly description?: string, // Optional description
        public readonly tooltip?: string, // Tooltip
        public readonly collapsibleState?: vscode.TreeItemCollapsibleState, // Collapse state
        public readonly command?: vscode.Command // Command when clicked
    ) {
        super(label, collapsibleState || vscode.TreeItemCollapsibleState.None);
    }
}
