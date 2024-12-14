import * as vscode from 'vscode';

export class OutlineProvider implements vscode.TreeDataProvider<OutlineItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<OutlineItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getTreeItem(element: OutlineItem): vscode.TreeItem {
        return element;
    }

    getChildren(): OutlineItem[] {
        return [
            new OutlineItem(
                'Open Dashboard',
                'Click to open PyTypeWizard Dashboard',
                {
                    command: 'pytypewizard.toggleDashboard',
                    title: 'Open Dashboard',
                    tooltip: 'Open PyTypeWizard Dashboard'
                }
            )
        ];
    }
}

class OutlineItem extends vscode.TreeItem {
    constructor(
        label: string,
        tooltip: string,
        command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = tooltip;
        this.command = command;
        this.iconPath = new vscode.ThemeIcon('preview');
    }
}
