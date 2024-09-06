import * as vscode from 'vscode';
import { PythonExtension, PVSC_EXTENSION_ID } from '@vscode/python-extension';
import { createLanguageClient, listenForEnvChanges } from './languageClient';
import { installPyre } from './install';
import { PyreCodeActionProvider } from './codeActionProvider';
import { findPyreCommand, registerCommands } from './command';
import { LanguageClient } from 'vscode-languageclient';

type LanguageClientState = {
	languageClient: LanguageClient,
	configListener: Promise<vscode.Disposable>
};

let envListener: vscode.Disposable | undefined;
let state: LanguageClientState | undefined;

export async function activate(context: vscode.ExtensionContext) {
	let pythonExtension = vscode.extensions.getExtension<PythonExtension>(PVSC_EXTENSION_ID);

	if (!pythonExtension) {
		vscode.window.showErrorMessage('Failed to load Python extension. Pyre cannot function.');
		return;
	}

	if (!pythonExtension.isActive) {
		await pythonExtension.activate();
	}

	const activatedEnvPath = pythonExtension.exports.environments.getActiveEnvironmentPath();
	let pyrePath = await findPyreCommand(activatedEnvPath);

	if (!pyrePath) {
		await installPyre();
		pyrePath = await findPyreCommand(activatedEnvPath);
	}

	if (pyrePath) {
		state = createLanguageClient(pyrePath);
		listenForEnvChanges(pythonExtension, state);
	}

	registerCommands(context, activatedEnvPath.path);
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
