import * as vscode from 'vscode';

export class PyreCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, _range: vscode.Range, context: vscode.CodeActionContext, _token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        const diagnostics = context.diagnostics;
        if (diagnostics.length === 0) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of diagnostics) {

            // Create Fix action
            const fixAction = new vscode.CodeAction('Fix Pyre Error', vscode.CodeActionKind.QuickFix);
            fixAction.command = {
                title: 'Fix Pyre Error',
                command: 'pytypewizard.fixError',
                arguments: [document, diagnostic]
            };
            fixAction.diagnostics = [diagnostic];
            fixAction.isPreferred = true;
            actions.push(fixAction);

            const explainAction = new vscode.CodeAction('Explain Error', vscode.CodeActionKind.QuickFix);
            explainAction.command = {
                command: 'pytypewizard.explainError',
                title: 'Explain Error',
                arguments: [document, diagnostic]
            };
            actions.push(explainAction);
        }

        return actions;
    }}

