import * as vscode from 'vscode';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';

export async function installPyre(): Promise<void> {
    const installPyre = await vscode.window.showInformationMessage(
        'Pyre is not installed. Would you like to install it?',
        'Yes', 'No'
    );

    if (installPyre === 'Yes') {
        const installProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Installing Pyre",
            cancellable: false
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
        configurePyre();
    }
}

export function configurePyre(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Unable to determine workspace folder.');
        return;
    }

    const pyreConfigPath = join(workspaceFolder, '.pyre_configuration');
    if (!existsSync(pyreConfigPath)) {
        const pyreConfigContent = JSON.stringify({
            "site_package_search_strategy": "pep561",
            "source_directories": ["."]
        }, null, 2);
        writeFileSync(pyreConfigPath, pyreConfigContent);
        vscode.window.showInformationMessage('Pyre configuration added successfully.');
    }
}
