import * as vscode from 'vscode';
import { getWebviewContent } from '../utils';

export class PanelManager {
    private static instance: PanelManager;
    private solutionPanel: vscode.WebviewPanel | undefined;
    private solutions: any[] = [];
    private messageHandlers: Map<string, (message: any) => void> = new Map();


    private constructor() { }

    static getInstance(): PanelManager {
        if (!PanelManager.instance) {
            PanelManager.instance = new PanelManager();
        }
        return PanelManager.instance;
    }

    createPanel(context: vscode.ExtensionContext, errors: any[]) {
        if (!this.solutionPanel) {
            this.solutionPanel = vscode.window.createWebviewPanel(
                'pyTypeWizardSolution',
                'PyTypeWizard Dashboard',
                vscode.ViewColumn.Beside,
                { enableScripts: true, retainContextWhenHidden: true }
            );

            this.registerMessageHandlers(context);
            this.updateContent(context, errors);
        }
        return this.solutionPanel;
    }

    getPanel(): vscode.WebviewPanel | undefined {
        return this.solutionPanel;
    }

    updateContent(context: vscode.ExtensionContext, errors: any[]) {
        if (this.solutionPanel) {
            this.solutionPanel.webview.html = getWebviewContent(this.solutions, context, errors);
        }
    }

    setSolutions(solutions: any[]) {
        this.solutions = solutions;
    }

    togglePanel() {
        if (this.solutionPanel) {

            this.solutionPanel.reveal();

        }
    }

    // Add a new message handler
    addMessageHandler(command: string, handler: (message: any) => void) {
        this.messageHandlers.set(command, handler);
    }

    // Remove a message handler
    removeMessageHandler(command: string) {
        this.messageHandlers.delete(command);
    }

    private registerMessageHandlers(context: vscode.ExtensionContext) {
        this.solutionPanel?.webview.onDidReceiveMessage(
            (message) => {
                const handler = this.messageHandlers.get(message.command);
                if (handler) {
                    handler(message);
                } else {
                    vscode.window.showErrorMessage(`Unknown command: ${message.command}`);
                }
            },
            undefined,
            context.subscriptions
        );
    }

    // private registerMessageHandlers(context: vscode.ExtensionContext) {
    //     this.solutionPanel?.webview.onDidReceiveMessage(
    //         (message) => {
    //             switch (message.command) {
    //                 case 'viewFile':
    //                     vscode.workspace.openTextDocument(message.filePath).then(doc => {
    //                         vscode.window.showTextDocument(doc).then(editor => {
    //                             const position = new vscode.Position(message.line - 1, message.column - 1);
    //                             editor.selection = new vscode.Selection(position, position);
    //                             editor.revealRange(new vscode.Range(position, position));
    //                         });
    //                     });
    //                     break;

    //                 case 'quickFix':
    //                     vscode.window.showWarningMessage(`Inside Fix, ${message.index}, ${message.command}`);
    //                     break;

    //                 default:
    //                     vscode.window.showErrorMessage(`Unknown command: ${message.command}`);
    //             }
    //         },
    //         undefined,
    //         context.subscriptions
    //     );
    // }

    showPanel(context: vscode.ExtensionContext, errors: any[]) {
        if (!this.solutionPanel) {
            this.createPanel(context, errors);
        }
        this.solutionPanel?.reveal();
        this.updateContent(context, errors);
    }
}
