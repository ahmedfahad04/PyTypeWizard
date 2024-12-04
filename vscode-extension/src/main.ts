/**
 * Context: 
 * 	Context provides storage APIs for keeping data between sessions
 *	Manages extension's lifecycle and resources
 *	Handles subscriptions for commands, events, and disposables

 */

import { PVSC_EXTENSION_ID, PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { PyreCodeActionProvider } from './codeActionProvider';
import { findPyreCommand, registerCommands } from './command';
import { installPyre } from './install';
import { createLanguageClient, listenForEnvChanges } from './languageClient';

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

	const activePythonPath = pythonExtension.exports.environments.getActiveEnvironmentPath();
	let pyrePath: string | undefined = await findPyreCommand(activePythonPath);


	// check if PyRe is installed or not; if not then install it
	if (pyrePath && pyrePath.length > 0) {
		await installPyre();
		pyrePath = await findPyreCommand(activePythonPath);

	} else {
		vscode.window.showInformationMessage('TypeChecker Config setup failed')
	}

	// creating language server at pyrePath
	if (pyrePath) {
		state = createLanguageClient(pyrePath);
		listenForEnvChanges(pythonExtension, state);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('pytypewizard.restartExtension', async () => {
			// Deactivate the current extension instance
			deactivate();

			// Reactivate the extension
			await activate(context);

			vscode.window.showInformationMessage('PyTypeWizard Extension has been restarted.');
		})
	);

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
