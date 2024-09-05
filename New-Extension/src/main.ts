/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @file Entry point for Pyre's VSCode extension.
 */

import { EnvironmentPath, PVSC_EXTENSION_ID, PythonExtension } from '@vscode/python-extension';
import { existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as vscode from 'vscode';
import { DidChangeConfigurationNotification, LanguageClient, LanguageClientOptions } from 'vscode-languageclient';
import which from 'which';
import { PyreCodeActionProvider } from './codeActionProvider';

type LanguageClientState = {
	languageClient: LanguageClient,
	configListener: Promise<vscode.Disposable>
}

// Extension state
let state: LanguageClientState | undefined;
let envListener: vscode.Disposable | undefined;

let outputChannel = vscode.window.createOutputChannel("pyre");

export async function activate(context: vscode.ExtensionContext) {

	const pythonExtension = vscode.extensions.getExtension<PythonExtension>(PVSC_EXTENSION_ID);

	if (!pythonExtension) {
		outputChannel.appendLine("Python extension not found. Will use the default console environment.");
		state = createLanguageClient('pyre');
		outputChannel.appendLine("Done");
		return;
	}

	const activatedEnvPath = pythonExtension.exports.environments.getActiveEnvironmentPath();
	const pyrePath = await findPyreCommand(activatedEnvPath);

	if (pyrePath) {
		state = createLanguageClient(pyrePath);
	}

	const codeActionProvider = new PyreCodeActionProvider();
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ scheme: 'file', language: 'python' },
			codeActionProvider,
			{
				providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
			}
		)
	);


	vscode.commands.registerCommand('pyre.fixError', (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
		const fileName = document.uri.fsPath;
		const lineNumber = diagnostic.range.start.line + 1;
		const startColumn = diagnostic.range.start.character + 1;
		const endColumn = diagnostic.range.end.character + 1;

		// TODO: Implement actual fix logic here
		vscode.window.showInformationMessage(`Fixing error in ${fileName} at line ${lineNumber}, columns ${startColumn}-${endColumn}`);

		// For now, just show error details
		const message = `File: ${fileName}\nLine: ${lineNumber}\nColumns: ${startColumn}-${endColumn}\nError: ${diagnostic.message}`;
		vscode.window.showInformationMessage(message);
		outputChannel.appendLine(message);
	});


	envListener = pythonExtension.exports.environments.onDidChangeActiveEnvironmentPath(async (e) => {
		state?.languageClient?.stop();
		state?.configListener.then((listener) => listener.dispose());
		state = undefined;

		const pyrePath = await findPyreCommand(e);
		if (pyrePath) {
			state = createLanguageClient(pyrePath);
		}
	});
}

function createLanguageClient(pyrePath: string): LanguageClientState {

	const serverOptions = {
		command: pyrePath,
		args: ["persistent"]
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'python' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
		}
	};

	const languageClient = new LanguageClient(
		'pyre',
		'Pyre Language Client',
		serverOptions,
		clientOptions,
	)

	languageClient.registerProposedFeatures();

	const configListener = languageClient.onReady().then(() => {
		return vscode.workspace.onDidChangeConfiguration(() => {
			languageClient.sendNotification(DidChangeConfigurationNotification.type, { settings: null });
		});
	});

	languageClient.start();

	return { languageClient, configListener };
}

async function findPyreCommand(envPath: EnvironmentPath): Promise<string | undefined> {

	if (envPath.id === 'DEFAULT_PYTHON') {
		outputChannel.appendLine(`Using the default python environment`);
		return 'pyre';
	}

	const path = envPath.path;
	const stat = statSync(path)

	const pyrePath = stat.isFile()
		? join(dirname(envPath.path), 'pyre')
		: stat.isDirectory()
			? join(path, 'bin', 'pyre')
			: undefined;

	if (pyrePath && existsSync(pyrePath) && statSync(pyrePath).isFile()) {
		outputChannel.appendLine(`Using pyre path: ${pyrePath} from python environment: ${envPath.id} at ${envPath.path}`);
		return pyrePath;
	}

	const pyreFromPathEnvVariable = await which('pyre', { nothrow: true });
	if (pyreFromPathEnvVariable != null) {
		outputChannel.appendLine(`Using pyre path: ${pyreFromPathEnvVariable} from PATH`);
		return pyreFromPathEnvVariable;
	}

	outputChannel.appendLine(`Could not find pyre path from python environment: ${envPath.id} at ${envPath.path}`);
	return undefined;
}

export function deactivate() {
	state?.languageClient.stop();
	state?.configListener.then((listener) => listener.dispose());
	envListener?.dispose();
}
