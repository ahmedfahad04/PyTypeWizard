import { readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';
import { Solution } from './db/database';
import { getLLMService } from './llm';

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
    prevData?: string
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
            // if (prevData) {
            //     llmService.conversationHistory.push({
            //         role: "user",
            //         content: `
            //         # Previous Solution:
            //         ${prevData}
            //         `
            //     });
            // }
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
        id: uuidv4(),
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
