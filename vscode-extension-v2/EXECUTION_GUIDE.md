# PyTypeWizard Extension - Execution Guide

## Quick Start Execution Steps

### 1. Environment Setup
Ensure you have the following installed:
- **Node.js** (v14+): Download from [nodejs.org](https://nodejs.org/)
- **VS Code** (v1.96.0+): Download from [code.visualstudio.com](https://code.visualstudio.com/)
- **Python** (v3.6+): Download from [python.org](https://python.org/)

### 2. Project Setup
```bash
# Navigate to the extension directory
cd /home/fahad/Documents/PROJECTS/PyTypeWizard/vscode-extension-v2

# Install all npm dependencies
npm install

# Verify installation
ls node_modules  # Should show installed packages
```

### 3. Build Process
```bash
# Option A: One-time build
npm run compile

# Option B: Watch mode (recommended for development)
npm run watch
```

**Build Output Verification:**
- Check that `dist/` folder is created
- Check that `out/` folder contains compiled TypeScript
- Verify no compilation errors in terminal

### 4. Execute Extension

#### Method 1: VS Code Debug Launch (Primary Method)
1. Open project in VS Code:
   ```bash
   code /home/fahad/Documents/PROJECTS/PyTypeWizard/vscode-extension-v2
   ```

2. Launch Extension Development Host:
   - Press `F5` key, OR
   - Use menu: `Run > Start Debugging`, OR
   - Open Command Palette (`Ctrl+Shift+P`) → "Debug: Start Debugging"

3. A new VS Code window opens titled "Extension Development Host"

4. In the new window, test the extension:
   - Open a Python project
   - Create/open a Python file with type errors
   - Observe extension functionality

#### Method 2: Command Palette Launch
1. Open Command Palette: `Ctrl+Shift+P`
2. Type: "Developer: Reload Window"
3. Extension reloads in current window

#### Method 3: Run and Debug Panel
1. Open Run and Debug view: `Ctrl+Shift+D`
2. Select "Run Extension" from dropdown
3. Click green play button (▶️)

### 5. Verify Extension Functionality

#### Check Extension Activation
- Look for "PyTypeWizard" in the activity bar
- Check if sidebar shows PyTypeWizard panel
- Verify commands in Command Palette (`Ctrl+Shift+P` → type "PyTypeWizard")

#### Test Core Features
1. **Error Detection**: Open Python file with type errors
2. **Problems Panel**: View errors in VS Code Problems panel
3. **CodeLens**: Look for clickable hints above code
4. **Quick Fixes**: Click lightbulb icons for suggested fixes
5. **Sidebar**: Access PyTypeWizard panel for history and settings

### 6. Configuration Setup

#### Set API Keys (Required for LLM features)
1. Open VS Code Settings: `Ctrl+,`
2. Search for "PyTypeWizard"
3. Configure:
   - `pytypewizard.ApiKey`: Your API key
   - `pytypewizard.llmProvider`: "gemini" or "openai"
   - `pytypewizard.enableCodeLens`: true/false

#### Alternative Configuration via JSON
```json
{
    "pytypewizard.ApiKey": "your-api-key-here",
    "pytypewizard.llmProvider": "gemini",
    "pytypewizard.enableCodeLens": true,
    "pytypewizard.enabledErrorTypes": [
        "Incompatible variable type",
        "Incompatible parameter type",
        "Incompatible return type"
    ]
}
```

### 7. Testing with Sample Python Code

Create a test file `test_errors.py`:
```python
def add_numbers(a: int, b: int) -> int:
    return a + b

# This should trigger type errors
result = add_numbers("hello", "world")  # String instead of int
x: int = "not a number"  # Type mismatch
```

Expected behavior:
- Errors appear in Problems panel
- CodeLens appears above functions
- Quick fixes available via lightbulb
- Sidebar shows error details

### 8. Package for Distribution (Optional)

```bash
# Install VS Code Extension Manager
npm install -g @vscode/vsce

# Package the extension
vsce package

# Install the generated .vsix file
# In VS Code: Ctrl+Shift+P → "Extensions: Install from VSIX"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Compilation Errors
```bash
# Clear and rebuild
rm -rf node_modules dist out
npm install
npm run compile
```

#### 2. Extension Not Loading
- Check VS Code version compatibility (1.96.0+)
- Verify all dependencies installed: `npm ls`
- Check for TypeScript errors: `npx tsc -p ./`

#### 3. Python Features Not Working
- Ensure Python extension is installed in VS Code
- Verify Python interpreter is selected
- Install Pyre: `pip install pyre-check`

#### 4. API Features Not Working
- Verify API key is set in settings
- Check internet connection
- Ensure LLM provider is correctly configured

### Debug Logs
To view extension logs:
1. Open Output panel: `View > Output`
2. Select "PyTypeWizard" from dropdown
3. Monitor for error messages

### Performance Tips
- Use `npm run watch` during development
- Keep Extension Development Host window open
- Reload only when necessary

## Development Workflow

### Recommended Development Process
1. Start watch mode: `npm run watch`
2. Launch Extension Development Host: `F5`
3. Make code changes
4. Reload Extension Host: `Ctrl+R` in Extension Development Host window
5. Test changes
6. Repeat steps 3-5

### File Structure Overview
```
vscode-extension-v2/
├── src/               # TypeScript source code
├── gui/               # Svelte components
├── media/             # Icons and assets
├── dist/              # Webpack output
├── out/               # TypeScript output
├── package.json       # Extension manifest
└── tsconfig.json      # TypeScript configuration
```

This guide provides comprehensive steps to execute and test the PyTypeWizard VS Code extension.
