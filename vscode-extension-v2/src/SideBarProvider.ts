import * as vscode from "vscode";
import { DatabaseManager, Solution } from "./db/database";
import { generateAndStoreSolution, outputChannel } from "./utils";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // functionality to handle messages from the webview (to)
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "openFile": {
                    const document = await vscode.workspace.openTextDocument(data.file);
                    const editor = await vscode.window.showTextDocument(document);
                    const position = new vscode.Position(data.line - 1, data.column);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                    break;
                }
                case 'deleteEntry': {
                    if (!data.id) {
                        return;
                    }
                    const db = new DatabaseManager();
                    await db.deleteSolution(data.id);
                    const history: Solution[] = await db.getAllSolutions();
                    vscode.window.showInformationMessage('Solution deleted successfully');

                    this._view?.webview.postMessage({
                        type: 'history',
                        history: history,
                        currentPage: 'history'
                    });
                    break;
                }
                case 'saveEntry': {
                    if (!data.value) {
                        return;
                    }

                    const db = new DatabaseManager();
                    await db.addSolution(data.value);
                    const history: Solution[] = await db.getAllSolutions();
                    vscode.window.showInformationMessage('Solution saved successfully');

                    this._view?.webview.postMessage({
                        type: 'history',
                        history: history,
                        currentPage: 'main'
                    });
                    break;
                }
                case 'reGenerateSolution': {

                    // I want to pass the active editor content to the webview and the diagnostics
                    const document = data.document;
                    const diagnostic = data.diagnostic;
                    const { errorType, errorMessage, originalCode, suggestedSolution, filePath, lineNumber, timestamp } = data.solutionObject;

                    const prompt = `        
                        # Error Details
                        Error Type: ${errorType}
                        Error Message: ${errorMessage}
                        Error Code Snippet: ${originalCode}
                        Source Code: ${document}

                        # Previous Solution:
                        ${suggestedSolution}
        
                        # Instruction
                        Your Previous answer was wrong. Now rethink the correct solution. Answer in the following format:
                        * put the solution only snippet as python code snippet at first
                        * Add necessary explanation in easy words and bullet points. Important words should be written in bold.
                        `;

                    const solutionObject = await generateAndStoreSolution(
                        errorType, errorMessage, filePath, lineNumber, originalCode, prompt
                    );

                    if (solutionObject.suggestedSolution.length > 0) {
                        this._view?.webview.postMessage({
                            type: 'solutionGenerated',
                            solution: solutionObject.suggestedSolution,
                            solutionObject: solutionObject,
                            document: document,
                            diagnostic: diagnostic
                        });
                    }

                    vscode.window.showInformationMessage('Solution re-generated successfully');

                    break;
                }
                case 'applyFix': {
                    const { errorType, errorMessage, filePath, lineNumber } = data.solutionObject;
                    outputChannel.appendLine('Fix applied successfully ' + errorType + ' ' + errorMessage + ' ' + lineNumber);

                    const uri = vscode.Uri.file(filePath);
                    const document = await vscode.workspace.openTextDocument(uri);
                    const editor = await vscode.window.showTextDocument(document);
                    const decoration = vscode.window.createTextEditorDecorationType({
                        backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
                    });

                    const position = new vscode.Position(lineNumber - 1, 0);
                    editor.setDecorations(decoration, [new vscode.Range(position, position)])

                    editor.edit(editBuilder => {
                        editBuilder.replace(new vscode.Range(position, position), data.code);
                    });

                    const fixLength = data.code.split('\n').length;
                    vscode.window.showInformationMessage(`Code Length: ${fixLength}`);

                    // now here, register codelense with accept and reject button
                    // if accept, then delete the decoration 
                    // if reject, then remove the code snippet and add the decoration as well

                    const codeLensProvider = new class implements vscode.CodeLensProvider {
                        provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
                            const range = new vscode.Range(position, position);

                            const acceptLens = new vscode.CodeLens(range, {
                                title: "✓ Accept Fix",
                                command: 'pytypewizard.acceptFix',
                                arguments: [document, position, decoration]
                            });

                            const rejectLens = new vscode.CodeLens(range, {
                                title: "✗ Reject Fix",
                                command: 'pytypewizard.rejectFix',
                                arguments: [document, position, decoration, data.code]
                            });

                            return [acceptLens, rejectLens];
                        }
                    };

                    const disposables: vscode.Disposable[] = [];
                    disposables.push(
                        vscode.languages.registerCodeLensProvider({ language: 'python' }, codeLensProvider),

                        vscode.commands.registerCommand('pytypewizard.acceptFix', async (document, position, decoration) => {
                            decoration.dispose();
                            await document.save();
                            vscode.window.showInformationMessage('Fix applied successfully!');
                            disposables.forEach(d => d.dispose());
                        }),

                        vscode.commands.registerCommand('pytypewizard.rejectFix', async (document, position, decoration, code) => {
                            const editor = await vscode.window.showTextDocument(document);

                            //! we have to select the text and then press the reject button
                            const selection = editor.selection;

                            await editor.edit(builder => {
                                builder.delete(selection);
                            });

                            decoration.dispose();
                            vscode.window.showInformationMessage('Fix rejected');
                            disposables.forEach(d => d.dispose());
                        })
                    );

                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
        );

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				
                <link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">

                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>

                <link rel="stylesheet" href="/path/to/styles/default.min.css">
                <script>hljs.highlightAll();</script>

                <script nonce="${nonce}">
                    const tsvscode = acquireVsCodeApi();
                </script>
			</head>
            <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
