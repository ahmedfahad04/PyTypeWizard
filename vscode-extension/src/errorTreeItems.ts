import * as vscode from 'vscode';


export class ErrorTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description?: string,
        public readonly tooltip?: string,
        public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState || vscode.TreeItemCollapsibleState.None);

        // Add button for webview toggle
        if (label === 'Open Dashboard') {
            this.command = {
                title: 'Toggle Dashboard',
                command: 'pytypewizard.toggleDashboard',
                tooltip: 'Open PyTypeWizard Dashboard'
            };
            this.iconPath = new vscode.ThemeIcon('preview');
        }
    }
}
