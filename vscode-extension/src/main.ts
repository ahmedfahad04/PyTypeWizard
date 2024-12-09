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
import { PyreCodeActionProvider } from './codeActionProvider';
import { findPyreCommand, registerCommands } from './command';
import { checkPyreConfigFiles, isPyreCheckInstalled, setupPyreConfig } from './install';
import { createLanguageClient, listenForEnvChanges } from './languageClient';
import { getPyRePath } from './utils';

type LanguageClientState = {
	languageClient: LanguageClient,
	configListener: Promise<vscode.Disposable>
};

let envListener: vscode.Disposable | undefined;
let state: LanguageClientState | undefined;

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

	// creating language server at pyrePath
	if (pyreExePath) {
		state = createLanguageClient(pyreExePath);
		listenForEnvChanges(pythonExtension, state);
	}

	// show the 'Fix Issue' as QuickFix option under detected error
	registerCommands(context, activePythonPath.path);
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ scheme: 'file', language: 'python' },
			new PyreCodeActionProvider(),
			{ providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
		)
	);
}

export function deactivate() {
	state?.languageClient.stop();
	state?.configListener.then(listener => listener.dispose());
	envListener?.dispose();
}
