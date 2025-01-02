import * as vscode from 'vscode';
import { SidebarProvider } from './SideBarProvider';

export function activate(context: vscode.ExtensionContext) {

	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"pytypewizard-sidebar",
			sidebarProvider
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
