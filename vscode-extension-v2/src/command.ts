import { EnvironmentPath } from "@vscode/python-extension";
import axios from 'axios';
import { spawn } from "child_process";
import { existsSync, statSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import which from "which";
import { sendApiRequest } from "./api";
import { PyreCodeActionProvider } from "./codeActionProvider";
import { getChunkDatabaseManager, getDatabaseManager } from "./db";
import { Solution } from "./db/database";
import { DynamicCodeLensProvider } from "./dynamicCodeLensProvider";
import { processPythonFiles } from "./indexing/chunking";
import { getLLMService } from "./llm";
import { getSimplifiedSmartSelection } from "./smartSelection";
import { fetchContext, generateAndStoreSolution, getPyRePath, outputChannel } from './utils';
var Fuse = require('fuse.js');


export function registerCommands(context: vscode.ExtensionContext, pyrePath: string, sidebarProvider: any): void {

    const llmService = getLLMService();

    // command 1 (for webview)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.fixError', async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
            const filePath = document.uri.fsPath;
            const errMessage = diagnostic.message;
            const lineNum = diagnostic.range.start.line + 1;
            const colNum = diagnostic.range.start.character + 1;
            const outputDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
            const errType = errMessage.split(':', 2);
            const warningLine = document.lineAt(diagnostic.range.start.line).text.trim();

            const expandedRange = new vscode.Range(
                document.lineAt(diagnostic.range.start.line).range.start,
                document.lineAt(diagnostic.range.end.line).range.end
            );

            const targetPosition = new vscode.Position(diagnostic.range.start.line, diagnostic.range.start.character);
            const selection = getSimplifiedSmartSelection(document, targetPosition);

            //? set selection for desired code snippet
            if (selection && vscode.window.activeTextEditor) {
                // Set the selection in the editor
                vscode.window.activeTextEditor.selection = new vscode.Selection(document.lineAt(selection.start.line).range.start, document.lineAt(selection.end.line).range.end);

                // Reveal the selection in the editor
                vscode.window.activeTextEditor.revealRange(vscode.window.activeTextEditor.selection, vscode.TextEditorRevealType.InCenter);
            }

            let sourceCode: string;
            if (selection) {
                sourceCode = document.getText(new vscode.Range(document.lineAt(selection.start.line).range.start, document.lineAt(selection.end.line).range.end));
            } else {
                sourceCode = document.getText(expandedRange);
            }

            vscode.window.showInformationMessage(`SOURCE: ${selection?.start} - ${selection?.end}`);
            vscode.window.showInformationMessage(`SOURCE: ${sourceCode}`);


            const errorObject = {
                rule_id: errType[0],
                message: errType[1],
                warning_line: warningLine,
                source_code: sourceCode,
                // file_name: filePath,
                // line_num: lineNum,
                // col_num: colNum
            };

            await runErrorExtractor(context, filePath, errType[0], errType[1], lineNum, colNum, outputDir, pyrePath, errorObject);
        }));

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
                * put the solution only snippet as python code snippet at first. No need to mention skipped section or anything else. Just write down the exact lines sequentially.
                * Add necessary explanation in easy words and bullet points. Important words should be written in bold.
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

                    vscode.window.showInformationMessage(`Successfully indexed ${chunks.length} code chunks`);
                    chunkDb.close();
                }
            );
        })
    );

    // command 12 (clear LLM context)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.clearContext', async () => {
            llmService.clearConversationHistory();
            vscode.window.showInformationMessage('LLM Context Cleared Successfully!');
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

export async function runErrorExtractor(context: vscode.ExtensionContext, filePath: string, errType: string, errMessage: string, lineNum: number, colNum: number, outputDir: string, pythonPath: string, _inputobj: any) {
    return new Promise(async (resolve, reject) => {

        const scriptPath = path.join(context.extensionPath, 'src', 'script', 'error_extractor.py');

        const process = spawn(pythonPath, [scriptPath, filePath, errType, errMessage, lineNum.toString(), colNum.toString(), outputDir]);
        let output = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (data) => {
            console.error(`Error extractor error: ${data}`);
        });

        process.on('close', async (code) => {
            if (code === 0 && output) {
                try {
                    // const jsonOutput = JSON.parse(output);
                    const apiResponse = await sendApiRequest(_inputobj);
                    // print all of the generated solutions one by one in outputChannel
                    apiResponse.forEach((solution: string, index: number) => {
                        outputChannel.appendLine(`Solution ${index + 1}: ${solution}`);
                    });

                    resolve(Object.values(apiResponse));
                } catch (error) {
                    console.error('Error parsing output or sending API request:', error);
                    reject(error);
                }
            } else {
                reject(new Error('Error extractor failed'));
            }
        });
    });
}