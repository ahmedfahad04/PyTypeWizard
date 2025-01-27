import { EnvironmentPath } from "@vscode/python-extension";
import axios from 'axios';
import { spawn } from "child_process";
import { existsSync, statSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import which from "which";
import { sendApiRequest } from "./api";
import { PyreCodeActionProvider } from "./codeActionProvider";
import { getDatabaseManager } from "./db";
import { Solution } from "./db/database";
import { DynamicCodeLensProvider } from "./dynamicCodeLensProvider";
import { getLLMService } from "./llm";
import { getSimplifiedSmartSelection } from "./smartSelection";
import { generateAndStoreSolution, getPyRePath, outputChannel } from './utils';


export function registerCommands(context: vscode.ExtensionContext, pyrePath: string, sidebarProvider: any): void {

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

    // command 3 (for explain error)
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.explainAndSolve', async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {

            sidebarProvider._view?.webview.postMessage({
                type: 'solutionLoading',
                loading: true
            });

            outputChannel.appendLine(`TEXT: ${diagnostic.message}`)

            const errMessage = diagnostic.message;
            const errType = errMessage.split(':', 2);
            const warningLine = document.lineAt(diagnostic.range.start.line).text.trim();

            // const prompt = `
            //     Explain the following error in given instructions:

            //     # Error Details
            //     Error Type: ${errType[0]}
            //     Error Message: ${errType[1]}
            //     Code: ${warningLine}

            //     # Instruction
            //     Explain the given Python type error in simple and clear language in bullet point. The explanation should include the following section:
            //     1. What this error means.
            //     2. Why it occurs in the provided code.
            //     3. A short and practical hint (not the solution) to fix the error.

            //     Keep the explanation in details and focused so that developers can quickly understand and resolve the issue. Answer in markdown format.
            //     `;

            outputChannel.appendLine(`TEXT: ${vscode.window.activeTextEditor?.document.getText()}`)

            const prompt = `
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

            outputChannel.appendLine(`PROMPT:>> ${prompt}`);
            const solutionObject = await generateAndStoreSolution(errType[0], errMessage, document.uri.fsPath, diagnostic.range.start.line, warningLine, prompt);

            if (solutionObject?.suggestedSolution?.length > 0) {
                sidebarProvider._view?.webview.postMessage({
                    type: 'solutionGenerated',
                    solution: solutionObject.suggestedSolution,
                    solutionObject: solutionObject,
                    document: document,
                    diagnostic: diagnostic
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
            const query = await vscode.window.showInputBox({ placeHolder: 'Enter search query' });
            if (!query) return;

            try {
                const response = await axios.post('http://localhost:8000/search', { query });
                const results = response.data.results;

                if (results.length > 0) {
                    const items = results.map((result: any) => ({
                        label: `${result.file}:${result.line}`,
                        detail: result.snippet,
                    }));

                    const selection = await vscode.window.showQuickPick(items, { placeHolder: 'Search Results' });
                    if (selection) {
                        vscode.window.showInformationMessage(`Selected: ${selection}`);
                        // const [file, line] = selection.label.split(':');
                        // const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
                        // const editor = await vscode.window.showTextDocument(doc);
                        // const position = new vscode.Position(Number(line) - 1, 0);
                        // editor.selection = new vscode.Selection(position, position);
                        // editor.revealRange(new vscode.Range(position, position));
                    }
                } else {
                    vscode.window.showInformationMessage('No results found!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Search failed: ${error.message}`);
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
            const defaultPrompt = `Explain this terminology '${selectedText}' like a high school student with short and simple python example. Add the use cases as well. Be precise and short.
            Add the coding example at the end
            `;

            // const userPrompt = await vscode.window.showInputBox({
            //     value: defaultPrompt,
            //     placeHolder: "Modify the prompt if needed",
            //     prompt: "Press Enter to send or Escape to cancel"
            // });
            const userPrompt = defaultPrompt;

            if (userPrompt) {
                const response = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "PyTypeWizard",
                    cancellable: false
                }, async (progress, token) => {
                    progress.report({ message: 'Generating response...' });

                    // Check for cancellation before making the API call
                    if (token.isCancellationRequested) {
                        return null;
                    }

                    const llmService = getLLMService();
                    const result = await llmService.generateResponse(userPrompt);

                    // Check for cancellation after getting the response
                    if (token.isCancellationRequested) {
                        return null;
                    }

                    return result;
                });

                if (response.length > 0) {
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

    // command 9 (show History)
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

// Register the "Add to Chat" command
// export const addToChatCommand = 