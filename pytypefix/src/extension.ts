import * as cp from 'child_process';
import { debounce } from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';


const outputChannel = vscode.window.createOutputChannel('Pyre', { log: true });
const diagnosticCollection = vscode.languages.createDiagnosticCollection('pyre-errors');

let pyreCheckTimeout: NodeJS.Timeout | undefined;
const debouncedPyreCheck = debounce(runPyreCheck, 1000);


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

	// Clear previous diagnostics
	diagnosticCollection.clear();

	// Run Pyre check
	const shell = process.env.SHELL || '/bin/bash';
	cp.exec(`cd "${workspaceFolder}" && ${shell} -ic "pyre incremental"`, (err, stdout, stderr) => {

		const lines = stdout.trim().split('\n');
		let errorCount = 0;

		// detect error and show using squiggle
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

				// detect error and show using squiggle
				const diagnostic = new vscode.Diagnostic(range, `${errType} ${message}`, vscode.DiagnosticSeverity.Error);
				diagnostic.source = 'Pyre';

				diagnostic.relatedInformation = [
					new vscode.DiagnosticRelatedInformation(
						new vscode.Location(vscode.Uri.file(fullPath), range),
						message
					)
				];

				diagnosticCollection.set(vscode.Uri.file(fullPath), [diagnostic]);
				// vscode.window.showInformationMessage("FULL PAth: ", fullPath)

				//! create input json file 
				const pythonPath = process.env.PYTHON_PATH || 'python'; // or specify the full path to python executable
				cp.exec(`${shell} -ic "${pythonPath} /home/fahad/Documents/Projects/SPL3/pytypefix/src/error_extractor.py '${fullPath}' '${errType}' '${message}' ${lineNum} ${colNum}"`, (err, stdout, stderr) => {
					if (err) {
						console.error(`Error: ${stderr}`);
					}

					try {
						vscode.window.showInformationMessage(stdout)
						console.log('DeBUG: ', stdout)
						const errorInfo = JSON.parse(stdout);

						// Use errorInfo to create your diagnostic
						const diagnostic = new vscode.Diagnostic(
							new vscode.Range(+lineNum - 1, +colNum - 1, +lineNum - 1, +colNum),
							`Pyre (${errorInfo.rule_id}): ${errorInfo.source_code}`,
							vscode.DiagnosticSeverity.Error
						);

						diagnostic.source = 'Pyre';
						diagnostic.relatedInformation = [
							new vscode.DiagnosticRelatedInformation(
								new vscode.Location(vscode.Uri.file(fullPath), new vscode.Range(+lineNum - 1, 0, +lineNum - 1, 1000)),
								`Source: ${errorInfo.source_code}`
							)
						];

						diagnosticCollection.set(vscode.Uri.file(fullPath), [diagnostic]);
					} catch (parseError) {
						console.error(`Error parsing JSON: ${parseError}`);
					}
				});

				errorCount++;
			}
		}
	});
}

// Schedule Pyre check after a delay
function schedulePyreCheck() {
	if (pyreCheckTimeout) {
		clearTimeout(pyreCheckTimeout);
	}
	pyreCheckTimeout = setTimeout(runPyreCheck, 5000); // 5000ms delay (adjust as needed)
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

	// Listen for file changes to schedule Pyre checks
	vscode.workspace.onDidChangeTextDocument(() => {
		debouncedPyreCheck();
	});

	// Schedule initial Pyre check
	schedulePyreCheck();
}

export function deactivate() {
	if (pyreCheckTimeout) {
		clearTimeout(pyreCheckTimeout);
	}
}
