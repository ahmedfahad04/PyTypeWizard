import * as vscode from 'vscode';



export function extractSolutionCode(response: any): string {
    if (response && response.fix && Array.isArray(response.fix)) {
        vscode.window.showInformationMessage(response.fix[0])
        return response.fix;
    }
    return '';
}

function formatPythonCode(code: string): string {
    return code.trim().split('\n').map(line => line.trim()).join('\n');
}

export function getWebviewContent(solutions: string[]): string {
    const solutionsHtml = solutions.map((solution, index) => `
        <h3>Fix ${index + 1}:</h3>
        <pre><code>${solution}</code></pre>
    `).join('');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pyre Solutions</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            h2 {
                color: #2c3e50;
            }
            h3 {
                color: #34495e;
            }
            pre {
                background-color: #000000;
                color: #ffffff;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
            }
            code {
                font-family: 'Courier New', Courier, monospace;
            }
        </style>
    </head>
    <body>
        <h2>Suggested Fixes:</h2>
        ${solutionsHtml}
    </body>
    </html>`;
}
