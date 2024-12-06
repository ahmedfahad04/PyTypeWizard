/**
 * Context: 
 * 	Context provides storage APIs for keeping data between sessions
 *	Manages extension's lifecycle and resources
 *	Handles subscriptions for commands, events, and disposables

 */

import { PVSC_EXTENSION_ID, PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { PyreCodeActionProvider } from './codeActionProvider';
import { findPyreCommand, registerCommands } from './command';
import { checkPyreConfigFiles, installPyre } from './install';
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

	const isPyreConfigInstalled = checkPyreConfigFiles()

	// check if PyRe Configuration file is installed or not; if not then install it
	if (pyrePath && pyrePath.length > 0 && !isPyreConfigInstalled) {
		await installPyre();
		pyrePath = await findPyreCommand(activePythonPath);

	}

	// creating language server at pyrePath
	if (pyrePath) {
		state = createLanguageClient(pyrePath);
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
