import { statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';

export let outputChannel = vscode.window.createOutputChannel("PyTypeWizard");

export async function applyFix(document: vscode.TextDocument, range: vscode.Range, fix: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, fix);
    await vscode.workspace.applyEdit(edit);
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
                    <button onclick="applyFix(${index})">Apply Fix</button>
                    <button onclick="provideFeedback(${index})">Feedback</button>
                </div>
            </div>
        `).join('');

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .solution-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        margin: 10px 0;
                        padding: 15px;
                        transition: transform 0.2s;
                    }
                    .solution-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    .solution-header {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .code-block {
                        background: var(--vscode-editor-background);
                        padding: 10px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                    .button-group {
                        margin-top: 10px;
                        display: flex;
                        gap: 10px;
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
