"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const outputChannel = vscode.window.createOutputChannel('Pyre', { log: true });
// Check if Pyre is installed
async function isPyreInstalled() {
    return new Promise((resolve) => {
        const shell = process.env.SHELL || '/bin/bash'; // Fallback to bash
        cp.exec(`${shell} -ic "which pyre"`, (err, stdout) => {
            if (err || !stdout) {
                resolve(false);
            }
            else {
                const version = stdout.trim();
                outputChannel.appendLine(`✅ Pyre is installed at: ${version}`);
                resolve(true);
            }
        });
    });
}
// Install Pyre
async function installPyre() {
    const pipCommands = ['pip3', 'pip', 'python -m pip', 'python3 -m pip'];
    for (const cmd of pipCommands) {
        try {
            await new Promise((resolve, reject) => {
                const installProgress = vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Installing Pyre with ${cmd}...`,
                    cancellable: false
                }, () => {
                    return new Promise((resolveProgress) => {
                        cp.exec(`${cmd} install pyre-check`, (err, stdout, stderr) => {
                            if (err || stderr) {
                                reject(err || new Error(stderr));
                            }
                            else {
                                outputChannel.appendLine(`✅ Pyre installed successfully using ${cmd}`);
                                outputChannel.appendLine(stdout);
                                resolve(null);
                            }
                            resolveProgress();
                        });
                    });
                });
                installProgress;
                return true;
            });
        }
        catch {
            // Command failed, try next one
        }
    }
    vscode.window.showErrorMessage('Failed to install Pyre. pip not found. Please install pip manually.', 'Get Help').then(choice => {
        if (choice === 'Get Help') {
            vscode.env.openExternal(vscode.Uri.parse('https://pip.pypa.io/en/stable/installation/'));
        }
    });
    return false;
}
// Function to create a clickable link in the output channel
function createLink(filePath, line, column, title) {
    const path = vscode.Uri.file(filePath).toString();
    return `[${title}](${path}#${line},${column})`;
}
// Run Pyre check
async function runPyreCheck() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }
    const workspaceFolder = workspaceFolders[0].uri.fsPath;
    // Ensure the workspace has a .pyre_configuration file
    const pyreConfigPath = path.join(workspaceFolder, '.pyre_configuration');
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(pyreConfigPath));
    }
    catch {
        outputChannel.appendLine('❌ Error: .pyre_configuration file not found.');
        outputChannel.appendLine(`Run ${createLink(workspaceFolder, 0, 0, 'pyre init')} in the terminal to create one.\n`);
        const choice = await vscode.window.showErrorMessage('.pyre_configuration file not found. Run "pyre init" to create one.', 'Run in Terminal', 'Cancel');
        if (choice === 'Run in Terminal') {
            const terminal = vscode.window.createTerminal('Pyre Init');
            terminal.show();
            terminal.sendText(`cd "${workspaceFolder}" && pyre init`);
        }
        return;
    }
    // Run Pyre check
    return new Promise((resolve) => {
        outputChannel.clear(); // Clear previous output
        outputChannel.show(true); // Show and bring focus
        outputChannel.appendLine(`▶️ Running: pyre check in ${workspaceFolder}\n`);
        const shell = process.env.SHELL || '/bin/bash';
        cp.exec(`cd "${workspaceFolder}" && ${shell} -ic "pyre check"`, (err, stdout, stderr) => {
            if (err) {
                outputChannel.appendLine(`❌ Error running Pyre:\n${stderr || err?.message}`);
                const useTerminal = 'Run in Terminal';
                vscode.window.showErrorMessage(`Error running Pyre. See Output > Pyre for details.`, useTerminal)
                    .then(choice => {
                    if (choice === useTerminal) {
                        const terminal = vscode.window.createTerminal('Pyre Check');
                        terminal.show();
                        terminal.sendText(`cd "${workspaceFolder}" && pyre check`);
                    }
                });
            }
            else {
                const lines = stdout.trim().split('\n');
                let errorCount = 0;
                for (const line of lines) {
                    const match = line.match(/^(.+):(\d+):(\d+): (error|warning): (.+)$/);
                    if (match) {
                        const [_, file, lineNum, colNum, level, message] = match;
                        const fullPath = path.isAbsolute(file) ? file : path.join(workspaceFolder, file);
                        const color = level === 'error' ? 'red' : 'yellow';
                        const icon = level === 'error' ? '❌' : '⚠️';
                        errorCount += level === 'error' ? 1 : 0;
                        outputChannel.appendLine(`${icon} ${createLink(fullPath, +lineNum, +colNum, `${file}:${lineNum}:${colNum}`)} ${message}`);
                    }
                    else {
                        outputChannel.appendLine(line);
                    }
                }
                const summaryText = errorCount > 0
                    ? `Found ${errorCount} error(s). See Output > Pyre for details.`
                    : 'Pyre check completed. No errors found.';
                const summaryType = errorCount > 0
                    ? vscode.window.showErrorMessage
                    : vscode.window.showInformationMessage;
                summaryType(summaryText);
            }
            resolve();
        });
    });
}
async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.runPyreCheck', async () => {
        outputChannel.clear();
        let installed = await isPyreInstalled();
        if (!installed) {
            const shouldInstall = await vscode.window.showInformationMessage('Pyre is not installed. Would you like to install it?', 'Yes', 'No');
            if (shouldInstall === 'Yes') {
                installed = await installPyre();
            }
            else {
                return;
            }
        }
        if (installed) {
            await runPyreCheck();
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map