import * as vscode from 'vscode';
import { ErrorTreeItem } from './model/treeDataProvider';

export class ErrorProvider implements vscode.TreeDataProvider<ErrorTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ErrorTreeItem | undefined | null | void> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<ErrorTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private errors: ErrorTreeItem[] = [];

    refresh(errors: ErrorTreeItem[]): void {
        this.errors = errors;
        this._onDidChangeTreeData.fire(); // Notify the tree view to refresh
    }

    getTreeItem(element: ErrorTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ErrorTreeItem): ErrorTreeItem[] {
        if (element) {
            return []; // No children for individual errors
        }
        return this.errors; // Return top-level error items
    }
}
