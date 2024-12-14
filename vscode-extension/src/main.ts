/**
 * Context: 
 * 	Context provides storage APIs for keeping data between sessions
 *	Manages extension's lifecycle and resources
 *	Handles subscriptions for commands, events, and disposables
 */

import { PVSC_EXTENSION_ID, PythonExtension } from '@vscode/python-extension';
import { exec } from 'child_process';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { findPyreCommand, registerCommands } from './command';
import { checkPyreConfigFiles, isPyreCheckInstalled, setupPyreConfig } from './install';
import { createLanguageClient, listenForEnvChanges } from './languageClient';
import { PanelManager } from './model/panelManager';
import { ErrorObjectType } from './types/errorObjType';
import { getPyRePath, outputChannel } from './utils';

type LanguageClientState = {
	languageClient: LanguageClient,
	configListener: Promise<vscode.Disposable>
};

let envListener: vscode.Disposable | undefined;
let state: LanguageClientState | undefined;
export let solutionPanel: vscode.WebviewPanel | undefined;
export let errors: ErrorObjectType[];
let panelManager = PanelManager.getInstance();

export async function activate(context: vscode.ExtensionContext) {
	let pythonExtension = vscode.extensions.getExtension<PythonExtension>(PVSC_EXTENSION_ID);

	// check python env path
	if (!pythonExtension) {
		vscode.window.showErrorMessage('Failed to load Python extension. Pyre cannot function.');
		return;
	} else {
		vscode.window.showInformationMessage('Python extension started')
	}

	if (!pythonExtension.isActive) {
		await pythonExtension.activate();
	}

	// check if pyre-check package is installed or not
	const isPyreInstalled = await isPyreCheckInstalled();

	if (!isPyreInstalled) {
		const installProgress = vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Installing necessary packages",
			cancellable: false
		}, async (progress) => {
			progress.report({ message: "Installing..." });
			return new Promise<void>((resolve, reject) => {
				exec('pip install pyre-check', (error) => {
					if (error) {
						vscode.window.showErrorMessage('Failed to install pyre-check. Please install it manually.');
						reject(error);
					} else {
						vscode.window.showInformationMessage('Packages installed successfully!');
						resolve();
					}
				});
			});
		});

		try {
			await installProgress;
		} catch (error) {
			return; // Exit if installation failed
		}
	}

	const activePythonPath = pythonExtension.exports.environments.getActiveEnvironmentPath();
	let pyreExePath: string | undefined = await findPyreCommand(activePythonPath);

	const pyrePath = getPyRePath(activePythonPath.path);

	// check if PyRe Configuration file is installed or not; if not then install it
	const isPyreConfigInstalled = checkPyreConfigFiles()
	if (pyreExePath && pyreExePath.length > 0 && !isPyreConfigInstalled) {
		await setupPyreConfig(pyrePath);
		pyreExePath = await findPyreCommand(activePythonPath);
	}

	// Create or reuse webview

	// solutionPanel = panelManager.createPanel(context, []);

	if (pyreExePath) {
		state = createLanguageClient(pyreExePath);

		// Create status bar item
		const loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		loadingStatus.text = "$(sync~spin) PyTypeWizard initializing...";
		loadingStatus.show();

		// Single start() call with proper initialization
		await state.languageClient.start().then(() => {
			// Listen for diagnostic changes
			const diagnosticsListener = vscode.languages.onDidChangeDiagnostics((_e) => {
				const diagnostics = vscode.languages.getDiagnostics();
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

				errors = diagnostics.flatMap(([uri, diagnostics]) =>
					diagnostics.map(diagnostic => ({
						file_name: uri.fsPath, // Keep the full path
						display_name: uri.fsPath.replace(workspaceFolder + '/', ''), // For display only
						rule_id: diagnostic.message.split(':', 2)[0],
						message: diagnostic.message.split(':', 2)[1],
						line_num: diagnostic.range.start.line + 1,
						col_num: diagnostic.range.start.character + 1,
						length: diagnostics.length
					}))
				);

				// Single output channel message
				if (errors.length > 0) {
					outputChannel.clear(); // Clear previous messages
					outputChannel.appendLine(`Found ${errors.length} type checking errors`);
					outputChannel.appendLine(`Files; ${errors.map((i) => i.file_name)}`)
				}

				if (panelManager) {
					panelManager.updateContent(context, errors);

					// view file handler
					panelManager.addMessageHandler('viewFile', (message) => {
						vscode.workspace.openTextDocument(message.filePath).then(doc => {
							vscode.window.showTextDocument(doc).then(editor => {
								const position = new vscode.Position(message.line - 1, message.column - 1);
								editor.selection = new vscode.Selection(position, position);
								editor.revealRange(new vscode.Range(position, position));
							});
						});
					});

					// Add quickFix handler
					panelManager.addMessageHandler('quickFix', (message) => {
						vscode.window.showWarningMessage(`Inside Fix, ${message.index}, ${message.command}`);
					});
				}
			});

			context.subscriptions.push(diagnosticsListener);

			// Hide loading status once initialized
			loadingStatus.dispose();
			vscode.window.showInformationMessage('PyTypeWizard initialized successfully');
		});

		listenForEnvChanges(pythonExtension, state);
	}

	// register all commands for the extension
	registerCommands(context, activePythonPath.path);
}

export function deactivate() {
	state?.languageClient.stop();
	state?.configListener.then(listener => listener.dispose());
	envListener?.dispose();
}
