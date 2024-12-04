import axios from 'axios';
import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { RAGService } from './rag-service';
const ragService = RAGService.getInstance();

export function activate(context: vscode.ExtensionContext) {
    let backendProcess: ChildProcess | null = null;

    // Start backend server
    function startBackendServer() {
        const pythonPath = 'python3'; // or full path to python
        const scriptPath = path.join(context.extensionPath, 'backend', 'main.py');

        backendProcess = spawn(pythonPath, [scriptPath], {
            detached: true,
            stdio: 'ignore'
        });
    }

    // Stop backend server
    function stopBackendServer() {
        if (backendProcess) {
            process.kill(-backendProcess.pid);
            backendProcess = null;
        }
    }

    // Index entire workspace
    async function indexWorkspace() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace opened');
            return;
        }

        const workspaceFiles: { [key: string]: string } = {};

        // Recursively get all files
        for (const folder of workspaceFolders) {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*'),
                '**/node_modules/**,**/.git/**'
            );

            for (const file of files) {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    workspaceFiles[file.fsPath] = document.getText();
                } catch (err) {
                    console.error(`Could not read file ${file.fsPath}:`, err);
                }
            }
        }

        try {
            await axios.post('http://localhost:8000/index', { workspace_files: workspaceFiles });
            vscode.window.showInformationMessage('Workspace indexed successfully!');
        } catch (err) {
            vscode.window.showErrorMessage('Failed to index workspace');
        }
    }

    // Query workspace
    async function queryWorkspace() {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter your code query'
        });

        if (!query) return;

        try {
            const response = await axios.post('http://localhost:8000/query', { query });

            // Create output channel
            const channel = vscode.window.createOutputChannel('Code RAG Results');
            channel.clear();
            channel.appendLine(`Query: ${query}\n`);

            // Format and show results
            response.data.results.forEach((result: any, index: number) => {
                channel.appendLine(`Result ${index + 1}:`);
                channel.appendLine(`File: ${result.file_path}`);
                channel.appendLine(`Lines: ${result.start_line}-${result.end_line}`);
                channel.appendLine('Code:');
                channel.appendLine(result.content);
                channel.appendLine('---\n');
            });

            channel.show();
        } catch (err) {
            vscode.window.showErrorMessage('Failed to query workspace');
        }
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('codeRag.indexWorkspace', () => ragService.indexWorkspace()),
        vscode.commands.registerCommand('codeRag.query', () => ragService.queryWorkspace()),
        vscode.commands.registerCommand('codeRag.advancedSearch', () => ragService.advancedCodeSearch()),
        vscode.commands.registerCommand('codeRag.diagnostics', () => ragService.getDiagnostics())
    );

    // Setup file watcher
    const fileWatcher = ragService.setupFileWatcher();
    context.subscriptions.push(fileWatcher);

    // Start backend when extension activates
    startBackendServer();

    // Stop backend when extension deactivates
    context.subscriptions.push({
        dispose: () => {
            stopBackendServer();
        }
    });
}

export function deactivate() { }