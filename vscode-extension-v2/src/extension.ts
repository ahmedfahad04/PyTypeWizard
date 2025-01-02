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

	// const item = vscode.window.createStatusBarItem(
	// 	vscode.StatusBarAlignment.Right
	// );
	// item.text = "$(beaker) Open PyTypeWizard";
	// item.command = "pytypewizard.openDashboard";
	// item.show();

	// context.subscriptions.push(
	// 	vscode.commands.registerCommand("pytypewizard.openDashboard", () => {
	// 		if (sidebarProvider._view) {
	// 			sidebarProvider._view.show(true);
	// 		}
	// 	})
	// );


}

// This method is called when your extension is deactivated
export function deactivate() { }
