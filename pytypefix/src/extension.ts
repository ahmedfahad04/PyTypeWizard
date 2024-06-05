import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

// Function to get the full path of a command
//! -i: interactive mode causes the shell to read configuration files that set up your environment:
async function getCommandPath(command: string): Promise<string | null> {
	return new Promise((resolve) => {
		const shell = process.env.SHELL || '/bin/bash';  // Fallback to bash
		cp.exec(`${shell} -ic "which ${command}"`, (err, stdout) => {
			if (err || !stdout) {
				resolve(null);
			} else {
				resolve(stdout.trim().split('\n')[0]);
			}
		});
	});
}

// Check if Pyre is installed
async function isPyreInstalled(): Promise<boolean> {
	const pyrePath = await getCommandPath('pyre');
	if (pyrePath) {
		return new Promise((resolve) => {
			const shell = process.env.SHELL || '/bin/bash';
			cp.exec(`${shell} -ic "${pyrePath} --version"`, (err, stdout) => {
				if (stdout) {
					vscode.window.showInformationMessage(`Pyre version: ${stdout.trim()}`);
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	}
	return false;
}

// Install Pyre
async function installPyre(): Promise<boolean> {
	const pipPath = await getCommandPath('pip3') || await getCommandPath('pip');

	if (!pipPath) {
		const choice = await vscode.window.showErrorMessage(
			'pip3 or pip not found. Please install pip in your environment.',
			'Show me how', 'Use Terminal', 'Cancel'
		);

		if (choice === 'Show me how') {
			vscode.env.openExternal(vscode.Uri.parse('https://pip.pypa.io/en/stable/installation/'));
		} else if (choice === 'Use Terminal') {
			const terminal = vscode.window.createTerminal('Install Pyre');
			terminal.show();
			terminal.sendText('pip3 install pyre-check || pip install pyre-check');
			vscode.window.showInformationMessage('Please check the terminal for the installation process.');
			return true; // Optimistically return true, as we can't track the terminal's success
		}
		return false;
	}

	return new Promise((resolve) => {
		const installProgress = vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Installing Pyre...",
			cancellable: false
		}, (progress) => {
			progress.report({ increment: 0 });

			return new Promise<void>((resolveProgress) => {
				cp.exec(`"${pipPath}" install pyre-check`, (err, stdout, stderr) => {
					progress.report({ increment: 100 });

					if (err || stderr) {
						vscode.window.showErrorMessage(`Error installing Pyre: ${err ? err.message : stderr}`);
						resolve(false);
					} else {
						vscode.window.showInformationMessage("Pyre installed successfully");
						resolve(true);
					}

					resolveProgress();
				});
			});
		});

		return installProgress;
	});
}

// Run Pyre check
async function runPyreCheck() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found.');
		return;
	}

	const document = editor.document;
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder found.');
		return;
	}

	const workspaceFolder = workspaceFolders[0].uri.fsPath;

	// Ensure the workspace has a .pyre_configuration file (done)
	const pyreConfigPath = path.join(workspaceFolder, '.pyre_configuration');
	// vscode.window.showErrorMessage("Conf Path: " + pyreConfigPath);

	try {
		await vscode.workspace.fs.stat(vscode.Uri.file(pyreConfigPath));
	} catch {
		vscode.window.showErrorMessage('.pyre_configuration file not found in the workspace. Run "pyre init" to create one.');
		return;
	}

	const pyrePath = await getCommandPath('pyre');
	vscode.window.showErrorMessage("Command Path: " + pyrePath);

	if (!pyrePath) {
		vscode.window.showErrorMessage('Pyre command not found. Please ensure it is installed and in your PATH.');
		return;
	}

	// Run Pyre check
	return new Promise<void>((resolve) => {
		cp.exec(`cd "${workspaceFolder}" && "${pyrePath}" check`, (err, stdout, stderr) => {
			if (err || stderr) {
				const useTerminal = 'Use Terminal';
				vscode.window.showErrorMessage(`Error running Pyre: ${err ? err.message : stderr}`, useTerminal)
					.then(choice => {
						if (choice === useTerminal) {
							const terminal = vscode.window.createTerminal('Pyre Check');
							terminal.show();
							terminal.sendText(`cd "${workspaceFolder}" && pyre check`);
						}
					});
			} else {
				vscode.window.showInformationMessage(`Pyre Output:\n${stdout}`);
			}
			resolve();
		});
	});
}

export async function activate(context: vscode.ExtensionContext) {
	// Register the command
	let disposable = vscode.commands.registerCommand('extension.runPyreCheck', async () => {
		let installed = await isPyreInstalled();

		if (!installed) {
			const shouldInstall = await vscode.window.showInformationMessage(
				'Pyre is not installed or not in PATH. Would you like to install it?',
				'Yes', 'No', 'Use Terminal'
			);

			if (shouldInstall === 'Yes') {
				installed = await installPyre();
			} else if (shouldInstall === 'Use Terminal') {
				const terminal = vscode.window.createTerminal('Install Pyre');
				terminal.show();
				terminal.sendText('pip3 install pyre-check || pip install pyre-check');
				vscode.window.showInformationMessage('Please check the terminal for the installation process.');
				installed = true; // Optimistically set to true
			} else {
				return;
			}
		}

		if (installed) {
		await runPyreCheck();
		}
	});

	// vscode.window.showInformationMessage(`Hello ~ Istiaq Ahmed Fahad`);

	context.subscriptions.push(disposable);
}

export function deactivate() { }