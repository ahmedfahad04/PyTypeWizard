import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, DidChangeConfigurationNotification } from 'vscode-languageclient';
import { findPyreCommand } from './command';

type LanguageClientState = {
    languageClient: LanguageClient,
    configListener: Promise<vscode.Disposable>
}

export function createLanguageClient(pyrePath: string): LanguageClientState {
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

export function listenForEnvChanges(pythonExtension: any, state: any): void {
    pythonExtension.exports.environments.onDidChangeActiveEnvironmentPath(async (e) => {
        state?.languageClient?.stop();
        state?.configListener.then((listener: any) => listener.dispose());
        state = undefined;

        const pyrePath = await findPyreCommand(e);
        if (pyrePath) {
            state = createLanguageClient(pyrePath);
        }
    });
}
