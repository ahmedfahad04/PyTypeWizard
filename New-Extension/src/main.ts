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

	context.subscriptions.push(
		vscode.commands.registerCommand('pyre.restartExtension', async () => {
			// Deactivate the current extension instance
			await deactivate();

			// Reactivate the extension
			await activate(context);

			vscode.window.showInformationMessage('Pyre Extension has been restarted.');
		})
	);
}

export function deactivate() {
	state?.languageClient.stop();
	state?.configListener.then(listener => listener.dispose());
	envListener?.dispose();
}
