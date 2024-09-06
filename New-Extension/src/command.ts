import { EnvironmentPath } from "@vscode/python-extension";
import { existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as path from 'path';
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { sendApiRequest } from "./api";
import which from "which";

let outputChannel = vscode.window.createOutputChannel("pyre");

export function registerCommands(context: vscode.ExtensionContext, pyrePath: string): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('pyre.fixError', (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
            const filePath = document.uri.fsPath;
            const errMessage = diagnostic.message;
            const lineNum = diagnostic.range.start.line + 1;
            const colNum = diagnostic.range.start.character + 1;
            const outputDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
            const errType = errMessage.split(':', 2);

            runErrorExtractor(context, filePath, errType[0], errMessage, lineNum, colNum, outputDir, pyrePath);
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

export function runErrorExtractor(context: vscode.ExtensionContext, filePath: string, errType: string, errMessage: string, lineNum: number, colNum: number, outputDir: string, pythonPath: string) {
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
                const jsonOutput = JSON.parse(output);
                await sendApiRequest(jsonOutput);
            } catch (error) {
                console.error('Error parsing output or sending API request:', error);
            }
        }
    });
}
