import * as vscode from 'vscode';
import { Middleware } from 'vscode-languageclient';
import { LanguageClient, LanguageClientOptions } from 'vscode-languageclient/node';
import { findPyreCommand } from './command';
import { ErrorProvider } from './errorProvider';
import { ErrorTreeItem } from './model/treeDataProvider';

type LanguageClientState = {
    languageClient: LanguageClient,
    configListener: Promise<vscode.Disposable>
}

//! here it use pyre to check for type error
export function createLanguageClient(pyrePath: string, errorProvider: ErrorProvider): LanguageClientState {
    const serverOptions = {
        command: pyrePath,
        args: ["persistent"],
    };

    function getSelectedErrorTypes(): string[] {
        const config = vscode.workspace.getConfiguration('pyre');
        return config.get<string[]>('enabledErrorTypes', []);
    }

    const middleware: Middleware = {
        handleDiagnostics: (uri, diagnostics, next) => {
            const selectedErrorTypes = getSelectedErrorTypes();

            const filteredDiagnostics = diagnostics.filter(diagnostic =>
                selectedErrorTypes.some(errorType => diagnostic.message.includes(errorType))
            );

            // Convert diagnostics into tree items
            const errorItems = filteredDiagnostics.map(diagnostic => {
                const location = `${uri.fsPath}:${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}`;
                return new ErrorTreeItem(
                    'Pyre Error', // Label
                    diagnostic.message, // Description
                    location, // Tooltip
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: 'Open Error',
                        command: 'vscode.open',
                        arguments: [
                            uri,
                            {
                                selection: new vscode.Range(
                                    diagnostic.range.start,
                                    diagnostic.range.start
                                )
                            }
                        ]
                    }
                );
            });

            // Update the tree view with the latest errors
            errorProvider.refresh(errorItems);

            // Pass the filtered diagnostics to the next handler
            next(uri, filteredDiagnostics);
        }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'python' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc'),
        },
        // middleware,
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
            if (event.affectsConfiguration('pyre.enabledErrorTypes')) {
                languageClient.stop().then(() => {
                    languageClient.start();
                });
            }
        });
    });

    languageClient.start();

    return { languageClient, configListener };
}


export function listenForEnvChanges(pythonExtension: any, state: any, errorProvider: any): void {
    pythonExtension.exports.environments.onDidChangeActiveEnvironmentPath(async (e) => {
        state?.languageClient?.stop();
        state?.configListener.then((listener: any) => listener.dispose());
        state = undefined;

        const pyrePath = await findPyreCommand(e);
        if (pyrePath) {
            state = createLanguageClient(pyrePath, errorProvider);
        }
    });
}

// Function to fetch actual Pyre errors from the language client
export async function refreshPyreErrors(errorProvider: ErrorProvider, languageClient: LanguageClient) {
    const diagnostics = await languageClient.sendRequest('textDocument/publishDiagnostics');  // or similar method to fetch diagnostics
    const errorItems = diagnostics.map((diagnostic: any) => {
        const uri = diagnostic.uri; // The URI for the file where the error occurred
        const location = `${uri.fsPath}:${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}`;

        return new ErrorTreeItem(
            'Pyre Error', // Label
            diagnostic.message, // Description
            location, // Tooltip
            vscode.TreeItemCollapsibleState.None,
            {
                title: 'Open Error',
                command: 'vscode.open',
                arguments: [
                    uri,
                    {
                        selection: new vscode.Range(
                            diagnostic.range.start,
                            diagnostic.range.start
                        )
                    }
                ]
            }
        );
    });

    // Update the error provider with the latest errors
    errorProvider.refresh(errorItems); // Pass the error items to the tree view provider
}

