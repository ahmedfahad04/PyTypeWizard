import { readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';
import { ErrorObjectType } from './types/errorObjType';


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
    try {
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('Code copied to clipboard!');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to copy code to clipboard');
    }
}

export function extractPythonCode(text: string): string {
    // Regular expression to match Python code blocks enclosed in triple backticks
    const regex = /([\s\S]*?)/g;
    let match: RegExpExecArray | null;
    const codeBlocks: string[] = [];

    while ((match = regex.exec(text)) !== null) {
        // Remove "python" from the beginning of the captured group
        codeBlocks.push(match[1].trim());
    }

    return codeBlocks.join('\n'); // Join multiple code blocks if any
}

export function extractSolutionCode(response: any): any {
    console.log("GOT RESPONSE: ", response.fix);

    if (response && response.fix) {
        vscode.window.showInformationMessage(response.fix[0])
        return response.fix;
    }
    return {};
}

export function getWebviewContent(solutions: any[], context: vscode.ExtensionContext, errorObject: ErrorObjectType[]): string {
    const styleSheet = getStylesheet(context);

    // Generate error detail cards
    const problemDetails = errorObject.map((error, index) => `
    <div class="problem-details">
        <div class="detail-item">
            <div class="row">
                <button class="error-location" onclick="handleLocationClick('${error.file_name}', ${error.line_num}, ${error.col_num})">
                ${error.display_name} - Line: ${error.line_num}, Col: ${error.col_num}</button>
                <button class="btn" onClick="applyFix(${index})">Fix</button>
            </div>
            <div class="error-message">
                ${error.rule_id} - ${error.message}
            </div>
        </div>
    </div>
    `).join('');

    // Generate solution card
    let solutionCard;
    if (solutions.length > 0) {
        solutionCard = solutions.map((solution, index) => `
                <h2>Proposed Solution</h2>
                <div class="solution-card">
                    <div class="solution-header">Solution ${index + 1}</div>
                    <pre><code>${solution}</code></pre>
                    <div class="button-group">
                        <button class="vscode-button id="button-2" secondary" onclick="copyCode(${index})">Copy</button>
                    </div>
                </div>
            `).join('');
    } else {
        solutionCard = null
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
        <style>
            ${styleSheet}
        </style>
    </head>
    <body>
        <header>
            <h1>PyTypeWizard Dashboard</h1>
            <div class="project-health">
                <span class='sub-heading'>Total Errors: ${errorObject.length}</span>
                <span class="health-warning">Project Health: Warning</span>
            </div>
        </header>
        <hr />
       
        <div id="problem-details-section">
            ${problemDetails}
        </div>
        
        ${solutionCard ?? ''}
        <script>
            const vscode = acquireVsCodeApi();
            
            // Initialize syntax highlighting
            hljs.highlightAll();

            document.getElementById('alternatives')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'showAlternatives' }); 
            });

            function copyCode(index) {
                vscode.postMessage({ command: 'copyToClipboard', index });
            }

            function applyFix(index) {
                vscode.postMessage({ command: 'quickFix', index });
            }

            function handleLocationClick(filePath, line, column) {
                vscode.postMessage({
                    command: 'viewFile',
                    filePath: filePath,
                    line: line,
                    column: column
                });
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
