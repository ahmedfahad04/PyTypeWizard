import { readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';
import { getChunkDatabaseManager } from './db';
import { DatabaseManager, Solution } from './db/database';
import { processPythonFiles } from './indexing/chunking';
import { getLLMService } from './llm';
var Fuse = require('fuse.js');


export let outputChannel = vscode.window.createOutputChannel('PyTypeWizard');

export function getStylesheet(context: vscode.ExtensionContext): string {
    const stylePath = join(context.extensionPath, 'src', 'styles', 'webview.css');
    return readFileSync(stylePath, 'utf-8');
}

export async function applyFix(
    document: vscode.TextDocument,
    range: vscode.Range,
    fix: string
) {
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
    console.log('GOT RESPONSE: ', response.fix);

    if (response && response.fix) {
        vscode.window.showInformationMessage(response.fix[0]);
        return response.fix;
    }
    return {};
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

export async function generateAndStoreSolution(
    errType: string,
    errMessage: string,
    filePath: string,
    lineNumber: number,
    warningLine: string,
    prompt: string,
): Promise<Solution> {

    const response = await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Get Explanation',
            cancellable: true,
        },
        async (progress, token) => {
            progress.report({ message: 'Generating response...' });

            // Check for cancellation before making the API call
            if (token.isCancellationRequested) {
                return null;
            }

            const llmService = getLLMService();
            const result = await llmService.generateResponse(prompt);

            // Check for cancellation after getting the response
            if (token.isCancellationRequested) {
                return null;
            }

            return result;
        }
    );

    // Handle null response from cancellation
    if (!response) {
        vscode.window.showInformationMessage('Operation cancelled');
        return null;
    }

    const solutionObject: Solution = {
        id: crypto.randomUUID(),
        errorType: errType,
        errorMessage: errMessage,
        originalCode: warningLine,
        suggestedSolution: response,
        filePath: filePath,
        lineNumber: lineNumber,
        timestamp: new Date().toISOString(),
    };

    return solutionObject
}

export async function indexRepository(): Promise<void> {
    const { chunks } = await processPythonFiles(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '');
    const chunkDb = await getChunkDatabaseManager();

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Indexing Project',
            cancellable: true,
        },
        async (progress, token) => {
            const batchSize = 100; // Process chunks in batches
            const totalBatches = Math.ceil(chunks.length / batchSize);

            for (let i = 0; i < chunks.length; i += batchSize) {
                if (token.isCancellationRequested) {
                    chunkDb.close();
                    return;
                }

                const batch = chunks.slice(i, i + batchSize).map(chunk => ({
                    id: crypto.randomUUID(),
                    content: chunk.content,
                    filePath: chunk.metadata.filePath,
                    startLine: chunk.metadata.startLine,
                    endLine: chunk.metadata.endLine,
                    chunkType: chunk.metadata.type,
                    timestamp: new Date().toISOString()
                }));

                // Process batch in a single transaction
                await chunkDb.addChunks(batch);

                const progressPercent = ((i + batchSize) / chunks.length) * 100;
                progress.report({
                    message: `Storing chunks... ${Math.min(progressPercent, 100).toFixed(1)}%`,
                    increment: (1 / totalBatches) * 100
                });
            }

            chunkDb.trackRepository(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '');

            vscode.window.showInformationMessage(`Successfully indexed ${chunks.length} code chunks`);
        }
    );
}

export async function fetchContext(source: string): Promise<{
    context: string,
    metadata: Array<{ startLine: number, endLine: number, fileName: string, filePath: string }>
}> {

    const currentDirectory = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    let context: string = "";
    const metadata: Array<{ startLine: number, endLine: number, fileName: string, filePath: string }> = [];
    const chunkDb = await getChunkDatabaseManager();

    //! check if the repository has been indexed
    const isChunked = await chunkDb.isChunked(currentDirectory);

    if (!isChunked) {
        vscode.window.showWarningMessage('Repository has not been Indexed yet!');

        const solution = await vscode.window.showInformationMessage(
            'Would you like to index the repository now?',
            'Yes',
            'No'
        );

        if (solution === 'Yes') {
            await indexRepository();
        } else {
            return { context, metadata };
        }
    }

    const searchResults = await chunkDb.searchChunks(source);
    outputChannel.appendLine(`Search Results: ${searchResults.length}`);
    outputChannel.appendLine(`Search Results: ${searchResults.map(i => i.filePath).join('\n')}`);

    const fuseOptions = {
        shouldSort: true,
        isisCaseSensitive: true,
        threshold: 0.6,
        keys: ["content"]
    };

    const fuse = new Fuse(searchResults, fuseOptions);
    const rankedResults = fuse.search(source);

    const topResults = rankedResults.length > 0
        ? rankedResults.slice(0, Math.min(5, rankedResults.length)).map(result => result.item)
        : searchResults.length > 5 ? searchResults.slice(0, 5) : searchResults;

    for (const item of topResults) {
        const currentScriptPath = vscode.window.activeTextEditor.document.uri.fsPath;
        if (item['filePath'] === currentScriptPath) {
            continue;
        }

        context += `##File Path: \n${item['filePath']}\n\n##Code Snippet: \n${item['content']}\n\n`;

        metadata.push({
            startLine: item['startLine'],
            endLine: item['endLine'],
            fileName: item['filePath'].split('/').pop(),
            filePath: item['filePath']
        });

    }

    return { context, metadata };
}

export async function fetchPreviousSolutions(errorType: string, limit: number): Promise<string> {
    const db = new DatabaseManager();
    const history: Solution[] = await db.getSolutionsByErrorType(errorType, 3);

    let promptTemplate = "";

    for (const item of history) {
        promptTemplate += `\n##Error Type: \n${item.errorType}\n\n##Error Message: \n${item.errorMessage}\n\n##Suggested Solution: \n${item.suggestedSolution}\n\n`;
        promptTemplate += `\n-----\n`;
    }

    return promptTemplate;
}