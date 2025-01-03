import { EnvironmentPath } from "@vscode/python-extension";
import { spawn } from "child_process";
import { existsSync, statSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import which from "which";
import { sendApiRequest } from "./api";
import { PyreCodeActionProvider } from "./codeActionProvider";
import { getGeminiService } from "./llm";
import { getSimplifiedSmartSelection } from "./smartSelection";
import { getPyRePath, outputChannel } from './utils';

export function registerCommands(context: vscode.ExtensionContext, pyrePath: string): void {

    // const panelManager = PanelManager.getInstance();

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

            console.log(`DATA: \n${errorObject.source_code}`);

            // if (panelManager) {

            //     // Show loading message
            //     panelManager.setSolutions([])

            //     // Run error extractor and get solution
            //     const response = await runErrorExtractor(context, filePath, errType[0], errType[1], lineNum, colNum, outputDir, pyrePath, errorObject);

            //     // Update webview with solutions
            //     panelManager.setSolutions(Array.isArray(response) ? response : []);
            //     panelManager.showPanel(context, errors)

            //     // copy to clipboard handler
            //     panelManager.addMessageHandler('copyToClipboard', (message) => {
            //         if (Array.isArray(response) && response.length > message.index) {
            //             const data = response[message.index];
            //             vscode.env.clipboard.writeText(data).then(() => {
            //                 vscode.window.showInformationMessage('Copied to clipboard!');
            //             });
            //         } else {
            //             vscode.window.showErrorMessage('Invalid response or index');
            //         }
            //     });
            // }
        }));

    // command 3 (for Quick Fix option)
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'python' },
            new PyreCodeActionProvider(),
            { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
        )
    );

    // Add this to registerCommands function
    context.subscriptions.push(
        vscode.commands.registerCommand('pytypewizard.explainError', async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
            const errMessage = diagnostic.message;
            const errType = errMessage.split(':', 2);
            const warningLine = document.lineAt(diagnostic.range.start.line).text.trim();

            const prompt = `
                Explain the following error in given instructions:

                # Error Details
                Error Type: ${errType[0]}
                Error Message: ${errType[1]}
                Code: ${warningLine}

                # Instruction
                Explain the given Python type error in simple and clear language in bullet point. The explanation should include the following section:
                1. What this error means.
                2. Why it occurs in the provided code.
                3. A short and practical hint (not the solution) to fix the error.

                Keep the explanation in details and focused so that developers can quickly understand and resolve the issue. Answer in markdown format.
                `;

            // const prompt = `
            //     Explain the following error in given instructions:

            //     # Error Details
            //     Error Type: ${errType[0]}
            //     Error Message: ${errType[1]}
            //     Code: ${warningLine}

            //     # Instruction
            //     put the solution only as python code snippet. no explanation needed.
            //     `;

            vscode.window.showWarningMessage(`PROMPT:>> ${prompt}`);

            const response = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating error explanation...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 50 });
                const gemini = getGeminiService();
                const result = await gemini.generateResponse(prompt);
                progress.report({ increment: 50 });
                return result;
            });

            // panelManager.setSolutions([response]);
            // panelManager.showPanel(context, errors);

        })
    );

    // command 5 (Create a chat participant)
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
                    outputChannel.appendLine(`DATA: ${apiResponse[9]}`);

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
