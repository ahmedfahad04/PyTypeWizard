import { PVSC_EXTENSION_ID, PythonExtension } from '@vscode/python-extension';
import { exec } from 'child_process';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { findPyreCommand, registerCommands } from './core/command';
import { checkPyreConfigFiles, isPyreCheckInstalled, setupPyreConfig } from './core/install';
import { createLanguageClient, listenForEnvChanges } from './core/languageClient';
import { closeDatabaseConnection } from './db';
import { SidebarProvider } from './model/SideBarProvider';
import { ErrorObjectType } from './types/error.type';
import { getPyRePath, outputChannel } from './utils/helper';

type LanguageClientState = {
	languageClient: LanguageClient,
	configListener: Promise<vscode.Disposable>
};

let state: LanguageClientState | undefined;
export let solutionPanel: vscode.WebviewPanel | undefined;
export let errors: ErrorObjectType[];

export async function activate(context: vscode.ExtensionContext) {

	let pythonExtension = vscode.extensions.getExtension<PythonExtension>(PVSC_EXTENSION_ID);
	const sideBarProvider = new SidebarProvider(context.extensionUri);


	// check python env path
	if (!pythonExtension) {
		vscode.window.showErrorMessage('Failed to load Python extension. Pyre cannot function.');
		return;
	} else {
		vscode.window.showInformationMessage('Python extension started');
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
	const isPyreConfigInstalled = checkPyreConfigFiles();
	if (pyreExePath && pyreExePath.length > 0 && !isPyreConfigInstalled) {
		await setupPyreConfig(pyrePath);
		pyreExePath = await findPyreCommand(activePythonPath);
	}

	// Create or reuse webview
	if (pyreExePath) {
		state = createLanguageClient(pyreExePath);

		// Create status bar item
		const loadingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		loadingStatus.text = "$(sync~spin) PyTypeWizard initializing...";
		loadingStatus.show();

		// Single start() call with proper initialization
		await state.languageClient.start().then(() => {
			// First collect all diagnostics in a single pass
			const diagnosticsListener = vscode.languages.onDidChangeDiagnostics((_e) => {
				const diagnostics = vscode.languages.getDiagnostics();
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				const typeErrors: ErrorObjectType[] = [];
				const filteredDiagnostics: { uri: vscode.Uri, diagnostic: vscode.Diagnostic }[] = [];

				// First pass - collect all Pyre error diagnostics
				diagnostics.forEach(([uri, diagnosticArray]) => {
					const pyreErrors = diagnosticArray.filter(diag =>
						diag.source === 'Pyre' &&
						diag.severity === vscode.DiagnosticSeverity.Error
					);

					if (pyreErrors.length > 0) {
						pyreErrors.forEach(diagnostic => {
							filteredDiagnostics.push({ uri, diagnostic });
						});
					}
				});

				// Second pass - transform filtered diagnostics into ErrorObjectType
				if (filteredDiagnostics.length > 0) {
					filteredDiagnostics.forEach(({ uri, diagnostic }) => {
						const [ruleId, message] = diagnostic.message.split(':', 2);
						typeErrors.push({
							file_name: uri.fsPath,
							display_name: uri.fsPath.replace(workspaceFolder + '/', ''),
							rule_id: ruleId,
							message: message,
							line_num: diagnostic.range.start.line + 1,
							col_num: diagnostic.range.start.character + 1,
							length: diagnostics.length
						});
					});

					// Send consolidated results to sidebar
					sideBarProvider._view?.webview.postMessage({
						type: 'typeErrors',
						errors: typeErrors
					});

					outputChannel.appendLine(`Processed ${typeErrors.length} type errors`);
				} else {
					// outputChannel.appendLine('No type errors found');
					sideBarProvider._view?.webview.postMessage({
						type: 'typeErrors',
						errors: []
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

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('pytypewizard-sidebar', sideBarProvider)
	);

	// register all commands for the extension
	registerCommands(context, activePythonPath.path, sideBarProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {
	closeDatabaseConnection();
}
