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

    
    showPanel(context: vscode.ExtensionContext, errors: any[]) {
        if (!this.solutionPanel) {
            this.createPanel(context, errors);
        }
        this.solutionPanel?.reveal();
        this.updateContent(context, errors);
    }
}
