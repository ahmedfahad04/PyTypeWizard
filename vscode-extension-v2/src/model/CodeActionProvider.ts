import * as vscode from 'vscode';

export class PyreCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, _token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {

        const diagnostics = context.diagnostics;
        const actions: vscode.CodeAction[] = [];

        if (diagnostics.length === 0) {
            return [];
        }

        for (const diagnostic of diagnostics) {

            //! Create Explain action
            const explainAction = new vscode.CodeAction('Fix & Explain', vscode.CodeActionKind.QuickFix);
            explainAction.command = {
                command: 'pytypewizard.explainAndSolve',
                title: 'Fix & Explain',
                arguments: [document, diagnostic]
            };
            actions.push(explainAction);

            //! Create Ignore action
            const errorMatch = diagnostic.message.match(/\[(\d+)\]/);
            if (errorMatch) {
                const errorNumber = errorMatch[1];
                const ignoreAction = new vscode.CodeAction(
                    `Ignore this type error`,
                    vscode.CodeActionKind.QuickFix
                );
                ignoreAction.edit = new vscode.WorkspaceEdit();

                // Get the line where we want to add the comment
                const line = document.lineAt(range.start.line);
                const indentation = line.text.match(/^\s*/)[0];

                // Add the ignore comment above the error line
                ignoreAction.edit.insert(
                    document.uri,
                    new vscode.Position(range.start.line, 0),
                    `${indentation}# pyre-fixme[${errorNumber}]\n`
                );
                actions.push(ignoreAction);
            }

            //! Create Ignore All action
            const ignoreAllAction = new vscode.CodeAction(
                'Ignore all type errors',
                vscode.CodeActionKind.QuickFix
            );
            ignoreAllAction.edit = new vscode.WorkspaceEdit();

            // Add ignore-all comment at the top of the file
            ignoreAllAction.edit.insert(
                document.uri,
                new vscode.Position(0, 0),
                '# pyre-ignore-all-errors\n'
            );
            actions.push(ignoreAllAction);

        }

        return actions;
    }
}

