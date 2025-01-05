import { exec } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { outputChannel } from './utils';

export async function isPyreCheckInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        exec('pip show pyre-check', (error) => {
            resolve(!error);
        });
    });
}

export async function setupPyreConfig(pyrePath: string): Promise<void> {
    const setupPyreConfig = await vscode.window.showInformationMessage(
        'PyTypeWizard is not activated. Would you like to activate it?',
        'Yes', 'No'
    );

    vscode.window.showInformationMessage("INSIDE INSTALL PYRE")

    if (setupPyreConfig === 'Yes') {
        const installProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Installing Pyre",
            cancellable: true
        }, async () => {
            return new Promise<void>((resolve, reject) => {
                exec('pip install pyre-check', (error) => {
                    if (error) {
                        vscode.window.showErrorMessage('Failed to install Pyre. Please install it manually.');
                        reject(error);
                    } else {
                        vscode.window.showInformationMessage('Pyre installed successfully!');
                        resolve();
                    }
                });
            });
        });

        await installProgress;
        configurePyre(pyrePath);
    }
}

export function configurePyre(pyrePath: string): void {

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Unable to determine workspace folder.');
        return;
    }

    const pyreConfigPath = join(workspaceFolder, '.pyre_configuration');
    const pyreWatchManPath = join(workspaceFolder, '.watchmanconfig')

    if (!existsSync(pyreConfigPath)) {
        const pyreConfigContent = JSON.stringify({
            "site_package_search_strategy": "pep561",
            "source_directories": ["."],
            "typeshed": pyrePath.replace('bin', 'lib') + '/typeshed'
        }, null, 2);
        writeFileSync(pyreConfigPath, pyreConfigContent);
        writeFileSync(pyreWatchManPath, '{}');
        vscode.window.showInformationMessage('PyTypeWizard configuration added successfully.');
    }
}

export function checkPyreConfigFiles(): boolean {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return false;
    }

    const pyreConfigPath = join(workspaceFolder, '.pyre');
    const pyreLocalConfigPath = join(workspaceFolder, '.pyre_configuration');
    const watchmanConfigPath = join(workspaceFolder, '.watchmanconfig');

    const hasPyreConfig = existsSync(pyreConfigPath);
    const hasPyreLocalConfig = existsSync(pyreLocalConfigPath);
    const hasWatchmanConfig = existsSync(watchmanConfigPath);

    outputChannel.appendLine(`Pyre: ${hasPyreConfig}`);
    outputChannel.appendLine(`Pyre Local: ${hasPyreLocalConfig}`);
    outputChannel.appendLine(`Watchman: ${hasWatchmanConfig}`);

    return hasPyreConfig && hasPyreLocalConfig && hasWatchmanConfig;
}

