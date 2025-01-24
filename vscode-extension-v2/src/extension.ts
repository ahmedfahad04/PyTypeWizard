import { PVSC_EXTENSION_ID, PythonExtension } from '@vscode/python-extension';
import { exec } from 'child_process';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { findPyreCommand, registerCommands } from './command';
import { fileCollectionAndPreprocessing } from './indexing/filePreProcessing';
import { tokenizeFile } from './indexing/tokenize';
import { checkPyreConfigFiles, isPyreCheckInstalled, setupPyreConfig } from './install';
import { createLanguageClient, listenForEnvChanges } from './languageClient';
import { SidebarProvider } from './SideBarProvider';
import { ErrorObjectType } from './types/errorObjType';
import { getPyRePath, outputChannel } from './utils';
import { closeDatabaseConnection } from './db';

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
			const diagnosticsListener = vscode.languages.onDidChangeDiagnostics((_e) => {
				const diagnostics = vscode.languages.getDiagnostics();
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				let typeErrors: ErrorObjectType[] = [];
				const filteredDiagnostics: any[] = [];

				diagnostics.forEach(([uri, diagnosticArray]) => {
					diagnosticArray.forEach((diag) => {
						if (
							diag.source === 'Pyre' && // Replace with your specific extension source
							diag.severity === vscode.DiagnosticSeverity.Error // Filter warnings
						) {
							filteredDiagnostics.push({ uri, diagnostic: diag });
						}
					});
				});

				if (filteredDiagnostics.length > 0) {
					filteredDiagnostics.forEach(({ uri, diagnostic }) => {
						typeErrors.push({
							file_name: uri.fsPath,
							display_name: uri.fsPath.replace(workspaceFolder + '/', ''),
							rule_id: diagnostic.message.split(':', 2)[0],
							message: diagnostic.message.split(':', 2)[1],
							line_num: diagnostic.range.start.line + 1,
							col_num: diagnostic.range.start.character + 1,
							length: diagnostics.length
						});
					});
				} else {
					outputChannel.appendLine('No matching diagnostics found.');
				}

				//! Send type errors to the sidebar
				sideBarProvider._view?.webview.postMessage({
					type: 'typeErrors',
					errors: typeErrors
				});
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

	//!
	// try {
	// 	let result = await fileCollectionAndPreprocessing();
	// 	// outputChannel.clear();
	// 	// outputChannel.appendLine(`Preprocessed files: ${result.map(i => i.filePath).join('\n')}`);
	// 	outputChannel.appendLine(`Total Preprocessed files: ${result.length}`);
	// 	// print content for only first 3 files
	// 	for (let i = 2; i < 3; i++) {
	// 		// outputChannel.appendLine(`Content of file ${i} - \n ${result[i].filePath}: ${result[i].content}`);
	// 		const tokenizedSnippets = await tokenizeFile(result[i].filePath, result[i].content);
	// 		outputChannel.appendLine(`Tokenized Snippets ${i} : ${tokenizedSnippets.map(i => i.content).join('\n')}`);
	// 	}

	// 	// outputChannel.appendLine(`Tokenized Snippets: ${tokenizedSnippets.map(i => i.content).join('\n')}`);
	// } catch (error) {
	// 	console.error("Error during file collection and preprocessing:", error);
	// }
}

// This method is called when your extension is deactivated
export function deactivate() { 
	closeDatabaseConnection();
}
