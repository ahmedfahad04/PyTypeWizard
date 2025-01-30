import { EnvironmentPath } from "@vscode/python-extension";
import axios from 'axios';
import { existsSync, statSync } from 'fs';
import * as vscode from 'vscode';
import which from "which";
import { getChunkDatabaseManager, getDatabaseManager } from "../db";

import { PyreCodeActionProvider } from "../model/CodeActionProvider";
import { DynamicCodeLensProvider } from "../model/DynamicCodeLensProvider";
import { Solution } from "../types/solution.type";
import { fetchContext, generateAndStoreSolution, getPyRePath, indexRepository, outputChannel } from '../utils/helper';
import { getLLMService } from "./llm";
var Fuse = require('fuse.js');


export function registerCommands(context: vscode.ExtensionContext, pyrePath: string, sidebarProvider: any): void {

    const llmService = getLLMService();

    // command 2 (for Quick Fix option)
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'python' },
            new PyreCodeActionProvider(),
            { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
        )
    );

    // command 3 (Fix & Explain)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.explainAndSolve', async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {

            sidebarProvider._view?.webview.postMessage({
                type: 'solutionLoading',
                loading: true
            });

            const errMessage = diagnostic.message;
            const errType = errMessage.split(':', 2);
            const warningLine = document.lineAt(diagnostic.range.start.line).text.trim();
            const { context, metadata } = await fetchContext(warningLine);

            let prompt = "";

            if (context.length != 0) {
                prompt = `
                Explain the following error in given instructions:

                # Error Details
                Error Type: ${errType[0]}
                Error Message: ${errType[1]}
                Error Code Snippet: ${warningLine}
                Source Code: ${vscode.window.activeTextEditor?.document.getText()}

                # Additional Code Context
                ${context}

                # Instruction
                Answer in the following format:
                * Put the corrected code solution as python code snippet at first. No need to mention skipped section or anything else. No need to fix other error of the script, just solve the selected error. 
                * Add reasoning regarding why this solution will work precisely.
                * Add necessary explanation in easy words and bullet points. Important words should be written in bold. But keep it precise.
                `;
            } else {
                prompt = `
                Explain the following error in given instructions:

                # Error Details
                Error Type: ${errType[0]}
                Error Message: ${errType[1]}
                Error Code Snippet: ${warningLine}
                Source Code: ${vscode.window.activeTextEditor?.document.getText()}                

                # Instruction
                Answer in the following format:
                * put the solution only snippet as python code snippet at first. No need to mention skipped section or anything else. Just write down the exact lines sequentially.
                * Add necessary explanation in easy words and bullet points. Important words should be written in bold.
                `;
            }

            outputChannel.appendLine(`PROMPT:>> ${prompt}`);
            const solutionObject = await generateAndStoreSolution(errType[0], errMessage, document.uri.fsPath, diagnostic.range.start.line, warningLine, prompt);

            if (solutionObject?.suggestedSolution?.length > 0) {
                sidebarProvider._view?.webview.postMessage({
                    type: 'solutionGenerated',
                    solution: solutionObject.suggestedSolution,
                    solutionObject: solutionObject,
                    document: document,
                    diagnostic: diagnostic,
                    context: metadata
                });
            } else {
                sidebarProvider._view?.webview.postMessage({
                    type: 'solutionLoading',
                    loading: false
                });
            }
        })
    );

    // command 4 (Create a chat participant)
    vscode.chat.createChatParticipant('pytypewizard-chat', async (request, _context, response, token) => {
        const userQuery = request.prompt;
        const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' });
        const messages = [
            vscode.LanguageModelChatMessage.User(userQuery)
        ];
        const chatRequest = await chatModels[0].sendRequest(messages, undefined, token);
        for await (const token of chatRequest.text) {
            response.markdown(token);
        }
    });

    // command 5 (Open Settings Page)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'pytypewizard settings');
        })
    );

    // Command 6 (Index Project)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.indexProject', async () => {
            const projectPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!projectPath) {
                vscode.window.showErrorMessage('No project folder found!');
                return;
            }

            try {
                const response = await axios.post('http://localhost:8000/index', { project_path: projectPath });
                vscode.window.showInformationMessage(response.data.message);
            } catch (error) {
                vscode.window.showErrorMessage(`Indexing failed: ${error.message}`);
            }
        })
    );

    // command 7 (Search Code)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.searchCode', async () => {
            // search the chunkdb for the code snippet
            const chunkDb = await getChunkDatabaseManager();

            // show input box
            const input = await vscode.window.showInputBox({
                placeHolder: "Search code snippet",
                prompt: "Enter the code snippet to search"
            });

            if (input.length > 0) {

                let context: string = "";

                const searchResults = await chunkDb.searchChunks(input);
                outputChannel.appendLine(`Search Results: ${searchResults.length}`);
                // outputChannel.appendLine(`Search Results: ${searchResults.map(i => i.filePath).join('\n')}`);

                const fuseOptions = {
                    shouldSort: true,
                    isCaseSensitive: true,
                    threshold: 0.6,
                    keys: [
                        "content",
                    ]
                };

                // use fuse.js to rank query
                const fuse = new Fuse(searchResults, fuseOptions);
                const rankedResults = fuse.search(input);
                outputChannel.appendLine(`Ranked Results Count: ${rankedResults.length}`);
                outputChannel.appendLine(`Ranked Results File Path: ${rankedResults.map(i => i.item['filePath']).join('\n')}`);

                // Get top 5 results with highest relevance scores
                const topResults = rankedResults.length > 0
                    ? rankedResults.slice(0, Math.min(5, rankedResults.length)).map(result => result.item)
                    : searchResults.length > 5 ? searchResults.slice(0, 5) : searchResults;

                for (const item of topResults) {
                    context += `##File Path: \n${item['filePath']}\n\n##Code Snippet: \n${item['content']}\n\n`;
                }

                outputChannel.appendLine(`Final Context: ${context}`);
            }
        })
    );

    // command 8 (Ask PyTypeWizard CodeLens Only)
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'python' }, new DynamicCodeLensProvider())
    );

    // command 9 (Ask PyTypeWizard)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.addToChat', async (selectedText: string, callback?: () => void) => {
            const defaultPrompt = `Explain this terminology '${selectedText}' with an coding related analogy and simple python example. Add the use cases as well. Be precise and short.
            Add the coding example at the end.
    
            Answer should following the given format below:
            * Explain in simple and easy analogy
            * Explain in technical way to understand relevant usage
            * Add the use cases in coding
            * Add the python code example
            `;

            const userInput = await vscode.window.showInputBox({
                placeHolder: "Enter your question about the selected text (Press Enter to use default)",
                prompt: "What would you like to know about this code?"
            });

            const finalPrompt = userInput ?
                `Explain about '${selectedText}': ${userInput}` :
                defaultPrompt;

            if (finalPrompt) {
                const response = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "PyTypeWizard",
                    cancellable: true
                }, async (progress, token) => {
                    progress.report({ message: 'Generating response...' });

                    if (token.isCancellationRequested) {
                        return null;
                    }

                    const result = await llmService.generateResponse(finalPrompt);

                    if (token.isCancellationRequested) {
                        return null;
                    }

                    return result;
                });

                if (response?.length > 0) {
                    sidebarProvider._view?.webview.postMessage({
                        type: 'explainTerminology',
                        explanation: response
                    });
                }
            }

            if (callback) {
                callback();
            }
        })
    );

    // command 10 (show History)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.showHistory', async () => {

            // read all data from database
            const db = await getDatabaseManager();
            const history: Solution[] = await db.getAllSolutions();

            if (history.length === 0) {
                vscode.window.showInformationMessage('No history found!');
                return;
            } else {
                sidebarProvider._view?.webview.postMessage({
                    type: 'history',
                    history: history,
                    currentPage: 'history'
                });
            }

        })
    );

    // command 11 (chunk Documents)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.chunkDocuments', async () => {

            const currentDirectory = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
            let context: string = "";
            const metadata: Array<{ startLine: number, endLine: number, fileName: string, filePath: string }> = [];
            const chunkDb = await getChunkDatabaseManager();

            //! check if the repository has been indexed
            const isChunked = await chunkDb.isChunked(currentDirectory);

            if (!isChunked) {
                vscode.window.showWarningMessage('Repository has not been Indexed yet!');
                await indexRepository();
            } else {
                vscode.window.showInformationMessage('Repository has been Indexed already!');
            }
        })
    );

    // command 12 (clear LLM context)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.clearContext', async () => {
            llmService.clearConversationHistory();
            vscode.window.showInformationMessage('Conversation history cleared!');
        })
    )

}

export async function findPyreCommand(envPath: EnvironmentPath): Promise<string | undefined> {

    if (envPath.id === 'DEFAULT_PYTHON') {
        outputChannel.appendLine(`Using the default python environment`);
        vscode.window.showInformationMessage(`Using the default python environment`);
    }

    const pyreCheckPath = getPyRePath(envPath.path);

    if (pyreCheckPath && existsSync(pyreCheckPath) && statSync(pyreCheckPath).isFile()) {
        vscode.window.showInformationMessage(`Using pyre path: ${pyreCheckPath} from python environment: ${envPath.id} at ${envPath.path}`);
        return pyreCheckPath;
    }

    const pyreFromPathEnvVariable = await which('pyre', { nothrow: true });

    if (pyreFromPathEnvVariable != null) {
        outputChannel.appendLine(`Using pyre from: ${pyreFromPathEnvVariable}`);
        return pyreFromPathEnvVariable;
    }

    vscode.window.showInformationMessage(`Could not find pyre path from python environment: ${envPath.id} at ${envPath.path}`);
    return pyreCheckPath;
}