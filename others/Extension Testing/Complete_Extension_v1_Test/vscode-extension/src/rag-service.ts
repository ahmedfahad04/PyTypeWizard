import axios from 'axios';
import * as vscode from 'vscode';

interface CodeChunk {
    content: string;
    file_path: string;
    start_line: number;
    end_line: number;
}

export class RAGService {
    private static instance: RAGService;
    private baseUrl: string = 'http://localhost:8000';
    private statusBarItem: vscode.StatusBarItem;

    private constructor() {
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.text = "$(search) Code RAG";
        this.statusBarItem.tooltip = "Code RAG Service";
        this.statusBarItem.show();
    }

    // Singleton pattern
    public static getInstance(): RAGService {
        if (!RAGService.instance) {
            RAGService.instance = new RAGService();
        }
        return RAGService.instance;
    }

    /**
     * Index entire workspace
     */
    public async indexWorkspace(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace opened');
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Indexing Workspace',
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                vscode.window.showInformationMessage('Workspace indexing canceled');
            });

            const workspaceFiles: { [key: string]: string } = {};
            let processedFiles = 0;

            // Find all files
            const files = await vscode.workspace.findFiles(
                '**/*',
                '**/node_modules/**,**/.git/**,**/*.{png,jpg,svg,gif,log,lock}'
            );

            // Process each file
            for (const file of files) {
                if (token.isCancellationRequested) break;

                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    workspaceFiles[file.fsPath] = document.getText();

                    // Update progress
                    processedFiles++;
                    progress.report({
                        increment: (processedFiles / files.length) * 100,
                        message: `Processed ${processedFiles}/${files.length} files`
                    });
                } catch (err) {
                    console.error(`Could not read file ${file.fsPath}:`, err);
                }
            }

            // Send to backend
            try {
                await axios.post(`${this.baseUrl}/index`, { workspace_files: workspaceFiles });
                vscode.window.showInformationMessage(`Workspace indexed: ${processedFiles} files processed`);
            } catch (err) {
                vscode.window.showErrorMessage('Failed to index workspace');
                console.error(err);
            }
        });
    }

    /**
     * Query workspace with advanced options
     */
    public async queryWorkspace(options?: {
        query?: string,
        fileTypes?: string[],
        maxResults?: number
    }): Promise<CodeChunk[]> {
        // Prompt for query if not provided
        const query = options?.query || await vscode.window.showInputBox({
            prompt: 'Enter your code query',
            placeHolder: 'Find code related to...'
        });

        if (!query) return [];

        try {
            // Show loading
            const progress = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Searching Code Repository',
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 0 });

                // Send query to backend
                const response = await axios.post(`${this.baseUrl}/query`, {
                    query,
                    max_results: options?.maxResults || 5
                });

                return response.data.results;
            });

            // Display results in quick pick
            const quickPickItems = progress.map((result: CodeChunk, index: number) => ({
                label: `Result ${index + 1}`,
                description: result.file_path,
                detail: `Lines ${result.start_line}-${result.end_line}`,
                result
            }));

            const selected = await vscode.window.showQuickPick(quickPickItems, {
                title: 'Code Search Results',
                placeHolder: 'Select a result to view details'
            });

            if (selected) {
                // Open file at specific location
                const doc = await vscode.workspace.openTextDocument(
                    vscode.Uri.file(selected?.result.file_path)
                );
                const editor = await vscode.window.showTextDocument(doc);

                // Highlight the specific range
                const range = new vscode.Range(
                    new vscode.Position(selected?.result.start_line - 1, 0),
                    new vscode.Position(selected?.result.end_line - 1, 999)
                );

                editor.revealRange(range);
                editor.selection = new vscode.Selection(range.start, range.end);
            }

            return progress;
        } catch (err) {
            vscode.window.showErrorMessage('Failed to query workspace');
            console.error(err);
            return [];
        }
    }

    /**
     * Update a specific file in the index
     */
    public async updateFile(filePath: string): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const content = document.getText();

            await axios.post(`${this.baseUrl}/update`, {
                file_path: filePath,
                content: content
            });
        } catch (err) {
            console.error(`Failed to update file ${filePath}:`, err);
        }
    }

    /**
     * File watcher to keep index updated
     */
    public setupFileWatcher(): vscode.Disposable {
        const watcher = vscode.workspace.createFileSystemWatcher(
            '**/*',
            false,
            false,
            false
        );

        // Update on file changes
        watcher.onDidChange(uri => this.updateFile(uri.fsPath));
        watcher.onDidCreate(uri => this.updateFile(uri.fsPath));

        return watcher;
    }

    /**
     * Advanced code search with filters
     */
    public async advancedCodeSearch(): Promise<void> {
        const query = await vscode.window.showInputBox({
            prompt: 'Advanced Code Search',
            placeHolder: 'Enter search query with optional filters'
        });

        if (!query) return;

        // Parse advanced query (simple implementation)
        const fileTypeMatch = query.match(/type:(\w+)/);
        const limitMatch = query.match(/limit:(\d+)/);

        const searchOptions = {
            query: query.replace(/type:\w+\s?/, '').replace(/limit:\d+\s?/, '').trim(),
            fileTypes: fileTypeMatch ? [fileTypeMatch[1]] : undefined,
            maxResults: limitMatch ? parseInt(limitMatch[1]) : 5
        };

        await this.queryWorkspace(searchOptions);
    }

    /**
     * Get diagnostic information about the RAG service
     */
    public async getDiagnostics(): Promise<void> {
        try {
            const diagnosticChannel = vscode.window.createOutputChannel('RAG Service Diagnostics');

            diagnosticChannel.appendLine('RAG Service Diagnostics');
            diagnosticChannel.appendLine('===================');

            // Check backend connection
            const startTime = Date.now();
            await axios.get(`${this.baseUrl}/health`);
            const responseTime = Date.now() - startTime;

            diagnosticChannel.appendLine(`Backend Response Time: ${responseTime}ms`);

            // Get workspace information
            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            diagnosticChannel.appendLine(`Workspace Folders: ${workspaceFolders.length}`);

            workspaceFolders.forEach(folder => {
                diagnosticChannel.appendLine(`- ${folder.uri.fsPath}`);
            });

            diagnosticChannel.show();
        } catch (err) {
            vscode.window.showErrorMessage('Failed to retrieve diagnostics');
        }
    }
}