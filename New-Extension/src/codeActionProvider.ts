import * as vscode from 'vscode';

export class PyreCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        const diagnostics = context.diagnostics;
        if (diagnostics.length === 0) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of diagnostics) {
            const action = new vscode.CodeAction('Fix Pyre Error', vscode.CodeActionKind.QuickFix);
            action.command = {
                title: 'Fix Pyre Error',
                command: 'pyre.fixError',
                arguments: [document, diagnostic]
            };
            action.diagnostics = [diagnostic];
            action.isPreferred = true;
            actions.push(action);
        }

        return actions;
    }
}

