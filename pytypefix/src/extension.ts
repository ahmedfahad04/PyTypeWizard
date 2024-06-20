import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Pyre', { log: true });
const diagnosticCollection = vscode.languages.createDiagnosticCollection('pyre-errors');

// Check if Pyre is installed
async function isPyreInstalled(): Promise<boolean> {
	return new Promise((resolve) => {
		const shell = process.env.SHELL || '/bin/bash';  // Fallback to bash
		cp.exec(`${shell} -ic "which pyre"`, (err, stdout) => {
			if (err || !stdout) {
				resolve(false);
			} else {
				const version = stdout.trim();
				outputChannel.appendLine(`✅ Pyre is installed at: ${version}`);
				resolve(true);
			}
		});
	});
}

// Install Pyre
async function installPyre(): Promise<boolean> {
	const pipCommands = ['pip3', 'pip', 'python -m pip', 'python3 -m pip'];

	for (const cmd of pipCommands) {
		try {
			await new Promise((resolve, reject) => {
				const installProgress = vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: `Installing Pyre with ${cmd}...`,
					cancellable: false
				}, () => {
					return new Promise<void>((resolveProgress) => {
						cp.exec(`${cmd} install pyre-check`, (err, stdout, stderr) => {
							if (err || stderr) {
								reject(err || new Error(stderr));
							} else {
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
		} catch {
			// Command failed, try next one
		}
	}

	vscode.window.showErrorMessage(
		'Failed to install Pyre. pip not found. Please install pip manually.',
		'Get Help'
	).then(choice => {
		if (choice === 'Get Help') {
			vscode.env.openExternal(vscode.Uri.parse('https://pip.pypa.io/en/stable/installation/'));
		}
	});

	return false;
}

// Function to create a clickable link in the output channel
function createLink(filePath: string, line: number, column: number, title: string): string {
	return `"${filePath}", line ${line}`;
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
	} catch {
		outputChannel.appendLine('❌ Error: .pyre_configuration file not found.');
		outputChannel.appendLine(`Run ${createLink(workspaceFolder, 0, 0, 'pyre init')} in the terminal to create one.\n`);
		const choice = await vscode.window.showErrorMessage(
			'.pyre_configuration file not found. Run "pyre init" to create one.',
			'Run in Terminal', 'Cancel'
		);

		if (choice === 'Run in Terminal') {
			const terminal = vscode.window.createTerminal('Pyre Init');
			terminal.sendText(`cd "${workspaceFolder}" && pyre init`);
		}

		return;
	}

	// Clear previous diagnostics
	diagnosticCollection.clear();

	// Run Pyre check
	outputChannel.clear(); // Clear previous output
	outputChannel.show(true); // Show and bring focus
	outputChannel.appendLine(`▶️ Running: pyre check in ${workspaceFolder}\n`);

	const shell = process.env.SHELL || '/bin/bash';

	cp.exec(`cd "${workspaceFolder}" && ${shell} -ic "pyre check"`, (err, stdout, stderr) => {
		if (err) {
			const lines = stdout.trim().split('\n');
			let errorCount = 0;

			for (const line of lines) {
				const pattern = /(?<file>.+):(?<lineNum>\d+):(?<colNum>\d+)\s(?<errType>[^:]+):\s(?<message>.+)/;
				const match = line.match(pattern);
				if (match) {
					const [_, file, lineNum, colNum, errType, message] = match;
					const fullPath = path.isAbsolute(file) ? file : path.join(workspaceFolder, file);

					const range = new vscode.Range(
						+lineNum - 1, // Convert to zero-based line number
						+colNum - 1, // Convert to zero-based column number
						+lineNum - 1,
						+colNum
					);

					const diagnostic = new vscode.Diagnostic(range, `[${errType}] ${message}`, vscode.DiagnosticSeverity.Error);
					diagnostic.source = 'Pyre';
					diagnosticCollection.set(vscode.Uri.file(fullPath), [diagnostic]);

					outputChannel.appendLine(`❌ [${errType}] ${createLink(fullPath, +lineNum, +colNum, `${file}:${lineNum}:${colNum}`)} ${message}`);
					errorCount++;
				} else {
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
		} else {
			vscode.window.showInformationMessage('No Error Found!')
		}
	});
}

// Register command to run Pyre check
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.runPyreCheck', async () => {
		outputChannel.clear();
		let installed = await isPyreInstalled();

		if (!installed) {
			const shouldInstall = await vscode.window.showInformationMessage(
				'Pyre is not installed. Would you like to install it?',
				'Yes', 'No'
			);

			if (shouldInstall === 'Yes') {
				installed = await installPyre();
			} else {
				return;
			}
		}

		if (installed) {
			await runPyreCheck();
		}
	});

	context.subscriptions.push(disposable);

	// Register hover provider for Pyre errors
	context.subscriptions.push(
		vscode.languages.registerHoverProvider('python', {
			provideHover(document, position, token) {
				const range = document.getWordRangeAtPosition(position);
				if (!range) return;

				const filePath = document.uri.fsPath;
				const diagnostics = diagnosticCollection.get(vscode.Uri.file(filePath));
				if (!diagnostics) return;

				for (const diagnostic of diagnostics) {
					if (diagnostic.range.contains(position)) {
						return new vscode.Hover(diagnostic.message);
					}
				}

				return null;
			}
		})
	);
}

export function deactivate() { }
