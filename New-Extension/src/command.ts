import { EnvironmentPath } from "@vscode/python-extension";
import { existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';
import { sendApiRequest } from "./api";
import which from "which";
import { getSimplifiedSmartSelection } from "./smartSelection";
import { getWebviewContent } from './utils'

let outputChannel = vscode.window.createOutputChannel("pyre");
let solutionPanel: vscode.WebviewPanel | undefined;


export function registerCommands(context: vscode.ExtensionContext, pyrePath: string): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('pyre.fixError', async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
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
            )

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

            //! should be integrated
            console.log(`SOUCE CODE: ${sourceCode}`);

            // Create and show webview
            if (!solutionPanel) {
                solutionPanel = vscode.window.createWebviewPanel(
                    'pyreSolution',
                    'Pyre Solution',
                    vscode.ViewColumn.Beside,
                    { enableScripts: true }
                );
                solutionPanel.onDidDispose(() => {
                    solutionPanel = undefined;
                });
            }

            // Show loading message
            solutionPanel.webview.html = getWebviewContent(['Generating solution...']);

            const obj = {
                "rule_id": errType[0],
                "message": errType[1],
                "warning_line": warningLine,
                "source_code": sourceCode,
            }

            // Run error extractor and get solution
            const response = await runErrorExtractor(context, filePath, errType[0], errType[1], lineNum, colNum, outputDir, pyrePath, obj);


            // Update webview with solution
            if (solutionPanel) {
                solutionPanel.webview.html = getWebviewContent(response as string[]);
            }

        })
    );
}

export async function findPyreCommand(envPath: EnvironmentPath): Promise<string | undefined> {

    if (envPath.id === 'DEFAULT_PYTHON') {
        outputChannel.appendLine(`Using the default python environment`);
        vscode.window.showInformationMessage(`Using the default python environment`);
        return 'pyre';
    }

    const path = envPath.path;
    const stat = statSync(path)

    const pyrePath = stat.isFile()
        ? join(dirname(envPath.path), 'pyre')
        : stat.isDirectory()
            ? join(path, 'bin', 'pyre')
            : undefined;

    if (pyrePath && existsSync(pyrePath) && statSync(pyrePath).isFile()) {
        outputChannel.appendLine(`Using pyre path: ${pyrePath} from python environment: ${envPath.id} at ${envPath.path}`);
        return pyrePath;
    }

    const pyreFromPathEnvVariable = await which('pyre', { nothrow: true });
    if (pyreFromPathEnvVariable != null) {
        outputChannel.appendLine(`Using pyre path: ${pyreFromPathEnvVariable} from PATH`);
        return pyreFromPathEnvVariable;
    }

    outputChannel.appendLine(`Could not find pyre path from python environment: ${envPath.id} at ${envPath.path}`);
    return undefined;
}

export async function runErrorExtractor(context: vscode.ExtensionContext, filePath: string, errType: string, errMessage: string, lineNum: number, colNum: number, outputDir: string, pythonPath: string, inputobj: any) {
    return new Promise(async (resolve, reject) => {

        // const scriptPath = path.join(context.extensionPath, 'src', 'script', 'error_extractor.py');

        // const process = spawn(pythonPath, [scriptPath, filePath, errType, errMessage, lineNum.toString(), colNum.toString(), outputDir]);
        // let output = '';

        // process.stdout.on('data', (data) => {
        //     output += data.toString();
        // });

        // process.stderr.on('data', (data) => {
        //     console.error(`Error extractor error: ${data}`);
        // });

        // process.on('close', async (code) => {
        // if (code === 0 && output) {
        try {
            // console.log("OUTPUT: ", output)
            // const jsonOutput = JSON.parse(output);
            const apiResponse = await sendApiRequest(inputobj);
            // Object.values(apiResponse)
            resolve(Object.values(apiResponse)); // Resolve with the API response
        } catch (error) {
            console.error('Error parsing output or sending API request:', error);
            reject(error);
        }
        // } else {
        // reject(new Error('Error extractor failed'));
        // }
        // });
    })
}
