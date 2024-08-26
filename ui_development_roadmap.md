### Refined Points

- Autostart the extension when any Python project is opened.
- Install Pyre on the client side for type checking.
- Monitor and validate type annotations; show red squiggles on invalid lines.
- On hover, display:
  - Error Rule ID
  - Error Message
  - Provide a quick fix button to call the backend API and fetch potential fixes.
- Display solutions in a WebView UI for user selection, with the chosen solution replacing the erroneous code.

### Required VSCode API

- `vscode.workspace.onDidOpenTextDocument` (Autostart extension on Python project)
- `vscode.commands.registerCommand` (Register commands for quick fixes)
- `vscode.languages.registerCodeActionsProvider` (Provide code actions for fixes)
- `vscode.window.showInformationMessage` (Show user messages)
- `vscode.window.createWebviewPanel` (Create a WebView UI)
- `vscode.diagnostics.createDiagnosticCollection` (Track and highlight errors)
- `vscode.workspace.applyEdit` (Apply code edits)
- `vscode.workspace.onDidChangeTextDocument` (Track user updates)

### Developer Roadmap

1. **Setup the VSCode Extension**

   - Initialize a VSCode extension using Yeoman or manual setup.
   - Autostart the extension for Python projects.

2. **Integrate Pyre for Type Checking**

   - Research and implement Pyre installation on the client side.
   - Periodically run Pyre to validate type annotations in open Python files.

3. **Create Diagnostics and Error Handling**

   - Utilize diagnostics API to identify invalid type annotations and display red squiggles.
   - Implement hover functionality to show error messages and rule IDs.

4. **Build Backend API Integration**

   - Set up a backend that resolves invalid annotations and returns possible fixes.
   - Implement quick fix actions using the backend API.

5. **Develop WebView UI for Fix Selection**

   - Upon receiving backend fixes, display them in a WebView UI.
   - Allow users to preview and select fixes.
   - Update the source code with the selected solution.

6. **Testing and Debugging**

   - Test the extension thoroughly with various Python projects.
   - Debug issues related to Pyre integration, diagnostics, and WebView interactions.

7. **Finalize and Publish**
   - Polish the UI and performance.
   - Publish the extension on the VSCode Marketplace.

### Core Features

- Auto Pyre installation and type-checking integration.
- Real-time error detection with detailed diagnostics.
- Quick-fix suggestions via API with WebView preview and selection.
- Seamless integration of fixes into the codebase.

---

To integrate Pyre into your VSCode extension, follow these steps:

### 1. **Install Pyre in the User's Environment**

First, Pyre needs to be installed in the user's Python environment. This can be done via pip or any other package manager:

```bash
pip install pyre-check
```

You can automate this process within your extension by adding a check during the activation phase:

```typescript
const { exec } = require('child_process');

function ensurePyreInstalled() {
	exec('pip show pyre-check', (error, stdout, stderr) => {
		if (stderr.includes('not found')) {
			exec('pip install pyre-check', (err) => {
				if (err) {
					vscode.window.showErrorMessage('Failed to install Pyre.');
				} else {
					vscode.window.showInformationMessage('Pyre installed successfully.');
				}
			});
		}
	});
}
```

Call `ensurePyreInstalled()` during extension activation.

### 2. **Setup Pyre Configuration**

Pyre requires a configuration file (`.pyre_configuration`) in the project directory. You can guide the user to create this file or automate the process if it doesn't exist.

```typescript
const fs = require('fs');
const path = require('path');

function createPyreConfiguration(workspaceRoot: string) {
	const pyreConfigPath = path.join(workspaceRoot, '.pyre_configuration');
	if (!fs.existsSync(pyreConfigPath)) {
		const configContent = JSON.stringify(
			{
				source_directories: ['.'],
				search_path: [],
			},
			null,
			4
		);

		fs.writeFileSync(pyreConfigPath, configContent);
		vscode.window.showInformationMessage('.pyre_configuration created.');
	}
}
```

This function checks if `.pyre_configuration` exists in the project folder and creates it if not.

### 3. **Run Pyre for Type Checking**

To run Pyre in the background and capture any issues with type annotations, use the following approach:

```typescript
function runPyreCheck(filePath: string) {
	const { exec } = require('child_process');
	exec(`pyre check ${filePath}`, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage('Error running Pyre.');
		} else {
			handlePyreOutput(stdout);
		}
	});
}

function handlePyreOutput(output: string) {
	const diagnostics = vscode.languages.createDiagnosticCollection('pyre');
	const issues = parsePyreOutput(output); // You'll need to parse the Pyre output format
	issues.forEach((issue) => {
		const diagnostic = new vscode.Diagnostic(
			issue.range,
			issue.message,
			vscode.DiagnosticSeverity.Error
		);
		diagnostics.set(issue.uri, [diagnostic]);
	});
}

function parsePyreOutput(output: string) {
	// Parse Pyre output and convert it to diagnostics format
	const issues = [];
	const lines = output.split('\n');
	lines.forEach((line) => {
		// Example of parsing Pyre error output (you'll need to handle Pyre's actual output format)
		const match = line.match(/path:(\d+):(\d+): (.+)/);
		if (match) {
			issues.push({
				uri: vscode.Uri.file(match[1]),
				range: new vscode.Range(
					new vscode.Position(parseInt(match[2]) - 1, 0),
					new vscode.Position(parseInt(match[2]) - 1, 100)
				),
				message: match[3],
			});
		}
	});
	return issues;
}
```

You should invoke `runPyreCheck()` whenever a Python file is saved or opened. You can register an event listener for these events:

```typescript
vscode.workspace.onDidSaveTextDocument((document) => {
	if (document.languageId === 'python') {
		runPyreCheck(document.uri.fsPath);
	}
});
```

### 4. **Display Diagnostics and Quick Fixes**

Use VSCode's `vscode.languages.registerCodeActionsProvider` API to provide suggestions when Pyre detects issues. Implement code actions for quick fixes.

```typescript
vscode.languages.registerCodeActionsProvider('python', {
	provideCodeActions(document, range, context, token) {
		const diagnostics = context.diagnostics;
		const quickFixes = diagnostics.map((diagnostic) => {
			const fix = new vscode.CodeAction(
				'Apply fix',
				vscode.CodeActionKind.QuickFix
			);
			fix.edit = new vscode.WorkspaceEdit();
			fix.edit.replace(document.uri, range, 'correct_type'); // Add logic for the fix
			return fix;
		});
		return quickFixes;
	},
});
```

### 5. **WebView Integration for Fix Selection**

After receiving potential fixes from the backend API, display them using VSCode's WebView API.

```typescript
function showFixInWebView(fixes: any[]) {
	const panel = vscode.window.createWebviewPanel(
		'fixSelection',
		'Select a Fix',
		vscode.ViewColumn.One,
		{}
	);
	const htmlContent = generateFixSelectionHtml(fixes);
	panel.webview.html = htmlContent;

	panel.webview.onDidReceiveMessage((message) => {
		if (message.command === 'applyFix') {
			applyFix(message.fix);
		}
	});
}
```

In the WebView, present the fixes, and when the user selects one, apply it to the document.

### 6. **Handle Backend Fixes**

Send the diagnostics to the backend API to resolve issues.

```typescript
function getFixesFromBackend(diagnostics) {
	const requestData = prepareFixRequest(diagnostics);
	fetch('http://backend.api/fix', {
		method: 'POST',
		body: JSON.stringify(requestData),
	})
		.then((response) => response.json())
		.then((data) => showFixInWebView(data.fixes));
}
```

### Summary

1. **Install Pyre**: Automatically install Pyre and check if it's available.
2. **Configure Pyre**: Ensure that the `.pyre_configuration` file exists.
3. **Run Pyre**: Trigger Pyre's type-checking periodically or upon file save/open.
4. **Show Diagnostics**: Display errors using VSCode's diagnostics API and provide code actions for fixes.
5. **Quick Fixes**: Fetch and display possible fixes using a backend API and present them in a WebView for user selection.

This approach integrates Pyre into a seamless workflow for Python projects in VSCode, with real-time type checking and user-friendly error resolution.

[GPT Chat](https://chatgpt.com/c/c077b7be-b80a-4675-a07e-2e5fca7bd175)
