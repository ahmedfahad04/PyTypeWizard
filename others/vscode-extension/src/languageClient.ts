import * as vscode from 'vscode';
import { Middleware } from 'vscode-languageclient';
import { LanguageClient, LanguageClientOptions } from 'vscode-languageclient/node';
import { findPyreCommand } from './command';

type LanguageClientState = {
    languageClient: LanguageClient,
    configListener: Promise<vscode.Disposable>
}

//! here it use pyre to check for type error
export function createLanguageClient(pyrePath: string): LanguageClientState {
    const serverOptions = {
        command: pyrePath,
        args: ["persistent"],
    };

    function getSelectedErrorTypes(): string[] {
        const config = vscode.workspace.getConfiguration('pytypewizard');
        return config.get<string[]>('enabledErrorTypes', []);
    }

    const middleware: Middleware = {
        handleDiagnostics: (uri, diagnostics, next) => {
            const selectedErrorTypes = getSelectedErrorTypes();

            const filteredDiagnostics = diagnostics.filter(diagnostic =>
                selectedErrorTypes.some(errorType => diagnostic.message.includes(errorType))
            );

            // Pass the filtered diagnostics to the next handler
            next(uri, filteredDiagnostics);
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'python' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
        },
        middleware, // shows the filtered errors only
    };

    const languageClient = new LanguageClient(
        'pyre',
        'Pyre Language Client',
        serverOptions,
        clientOptions
    );

    languageClient.registerProposedFeatures();

    const configListener = languageClient.start().then(() => {
        return vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('pytypewizard.enabledErrorTypes')) {
                languageClient.stop().then(() => {
                    languageClient.start();
                });
            }
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