import { statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';

export let outputChannel = vscode.window.createOutputChannel("PyTypeWizard");

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

export function getWebviewContent(solutions: any): string {
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
                    body {
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        padding: 10px;
                    }
                    .solution-card {
                        background: var(--vscode-sideBar-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        margin: 10px 0;
                        padding: 15px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .solution-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .solution-header {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-editor-foreground);
                    }
                    .code-block {
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 10px;
                        border-radius: 4px;
                        overflow-x: auto;
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                    }
                    .button-group {
                        margin-top: 10px;
                        display: flex;
                        gap: 10px;
                    }
                    .vscode-button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: var(--vscode-font-size);
                    }
                    .vscode-button.secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .vscode-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .loading {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 200px;
                    }
                    .spinner {
                        border: 4px solid rgba(0, 0, 0, 0.1);
                        border-left-color: var(--vscode-button-background);
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
                <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.7.0/styles/github-dark.min.css"
/>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
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
