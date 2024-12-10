import { readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';

export let outputChannel = vscode.window.createOutputChannel("PyTypeWizard");

export function getStylesheet(context: vscode.ExtensionContext): string {
    const stylePath = join(context.extensionPath, 'src', 'styles', 'webview.css');
    return readFileSync(stylePath, 'utf-8');
}

export async function applyFix(document: vscode.TextDocument, range: vscode.Range, fix: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, fix);
    await vscode.workspace.applyEdit(edit);
}

export async function copyToClipboard(text: string): Promise<void> {
    vscode.window.showInformationMessage(`Working inside`)
    try {
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('Code copied to clipboard!');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to copy code to clipboard');
    }
}


export function extractSolutionCode(response: any): any {
    console.log("GOT RESPONSE: ", response.fix);

    if (response && response.fix) {
        vscode.window.showInformationMessage(response.fix[0])
        return response.fix;
    }
    return {};
}

export function getWebviewContent(solutions: any, context: vscode.ExtensionContext): string {
    const styleSheet = getStylesheet(context);

    const solutionCards = solutions.map((solution, index) => `
            <div class="solution-card">
                <div class="solution-header">Solution ${index + 1}</div>
                <pre class="code-block"><code>${solution}</code></pre>
                <div class="button-group">
                    <button class="vscode-button" onclick="copyCode(${index})">Copy</button>
                </div>
            </div>
        `).join('');

    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <style>
                ${styleSheet}
                </style>

                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
                <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.7.0/styles/github-dark.min.css"/>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                <script src="node_modules/@vscode-elements/elements/dist/bundled.js" type="module"></script>
                <!-- and it's easy to individually load additional languages -->
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
                <script>hljs.highlightAll();</script>
            </head>
            <body>
                <div id="content">
                    ${solutions.length ? solutionCards : `
                        <div class="loading">
                            <div class="spinner"></div>
                        </div>
                    `}
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function applyFix(index) {
                        vscode.postMessage({ command: 'applyFix', index });
                    }
                    
                    function provideFeedback(index) {
                        vscode.postMessage({ command: 'provideFeedback', index });
                    }

                    function copyCode(index) {
                        vscode.postMessage({ command: 'copyToClipboard', index });
                    }
                </script>
            </body>
            </html>
        `;
}

export function getPyRePath(pythonPath: string): string {
    const stat = statSync(pythonPath);

    let pyrePath = stat.isFile()
        ? join(dirname(pythonPath), 'pyre_check')
        : stat.isDirectory()
            ? join(pythonPath, 'lib', 'pyre_check')
            : '';

    return pyrePath.includes('bin') ? pyrePath.replace('bin', 'lib') : pyrePath;
}
