import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('reactWebview.start', () => {
            // Create and show panel
            const panel = vscode.window.createWebviewPanel(
                'reactWebview',
                'React Webview',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
                }
            );

            // Load the webview HTML
            const webviewPath = vscode.Uri.file(path.join(context.extensionPath, 'dist', 'index.html'));
            panel.webview.html = getWebviewContent(panel.webview, context, webviewPath);

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'log':
                            vscode.window.showInformationMessage(message.text);
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Send initial data to webview
            panel.webview.postMessage({
                command: 'init',
                data: {
                    message: 'Hello from VS Code Extension!',
                    timestamp: new Date().toISOString()
                }
            });
        })
    );
}

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext, webviewPath: vscode.Uri) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js')));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Webview</title>
</head>
<body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function deactivate() { }