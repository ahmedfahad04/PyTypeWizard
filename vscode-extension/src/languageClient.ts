import * as vscode from 'vscode';
import { Middleware } from 'vscode-languageclient';
import { DidChangeConfigurationNotification, LanguageClient, LanguageClientOptions } from 'vscode-languageclient/node';
import { findPyreCommand } from './command';
import { PyreErrorCodes } from './types';

type LanguageClientState = {
    languageClient: LanguageClient,
    configListener: Promise<vscode.Disposable>
}

//! here it use pyre to check for type error

export function createLanguageClient(pyrePath: string): LanguageClientState {
    const serverOptions = {
        command: pyrePath,
        args: ["persistent"]
    };

    // Middleware to filter diagnostics
    const middleware: Middleware = {
        handleDiagnostics: (uri, diagnostics, next) => {
            const filteredDiagnostics = diagnostics.filter(diagnostic => {
                return Object.values(PyreErrorCodes).some(errorType =>
                    diagnostic.message.includes(errorType)
                );
            });
            next(uri, filteredDiagnostics);
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'python' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
        },
        middleware, // Apply the middleware
    };

    const languageClient = new LanguageClient(
        'pyre',
        'Pyre Language Client',
        serverOptions,
        clientOptions,
    );

    languageClient.registerProposedFeatures();

    const configListener = languageClient.start().then(() => {
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
