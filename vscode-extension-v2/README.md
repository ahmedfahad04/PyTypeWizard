# PyTypeWizard

A powerful VS Code extension for Python type checking and error fixing using Pyre.

## Features

- Real-time Python type checking using Pyre
- Automatic type error detection and fixes
- Smart code selection and analysis
- Interactive sidebar for error management
- Code lens support for quick type checking
- Explanation and solution suggestions for type errors

## Requirements

- Python 3.6 or higher
- VS Code Python extension
- Pyre-check package (auto-installed)
- Node.js (for development)

## Development Setup

### Prerequisites
1. **Node.js** (version 14 or higher)
2. **npm** or **yarn**
3. **VS Code** (version 1.96.0 or higher)
4. **Python** (version 3.6 or higher)

### Installation & Execution Process

#### Step 1: Clone and Setup
```bash
# Navigate to project directory
cd /path/to/PyTypeWizard/vscode-extension-v2

# Install dependencies
npm install
```

#### Step 2: Build the Extension
```bash
# Compile TypeScript and build with webpack
npm run compile

# Or start watch mode for development
npm run watch
```

#### Step 3: Run the Extension in Development Mode

**Method 1: Using VS Code Debug (Recommended)**
1. Open the project in VS Code
2. Press `F5` or use `Run > Start Debugging`
3. This will open a new "Extension Development Host" window
4. The extension will be automatically loaded in the new window

**Method 2: Using Command Palette**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Developer: Reload Window"
3. The extension will be reloaded

**Method 3: Manual Launch Configuration**
1. Go to Run and Debug view (`Ctrl+Shift+D`)
2. Select "Run Extension" from the dropdown
3. Click the green play button

#### Step 4: Test the Extension
1. In the Extension Development Host window, open a Python project
2. Open a Python file with type errors
3. The extension should automatically:
   - Detect type errors via Pyre
   - Show errors in the Problems panel
   - Provide CodeLens for quick fixes
   - Display the PyTypeWizard sidebar

#### Step 5: Extension Features
- **Sidebar**: Access via `View > Open View > PyTypeWizard`
- **Commands**: Use `Ctrl+Shift+P` and type "PyTypeWizard"
- **Settings**: Configure in VS Code settings under "PyTypeWizard"

### Available Commands

- `PyTypeWizard: Show History` - View solution history
- `PyTypeWizard: Open Settings` - Configure extension settings
- `PyTypeWizard: Chunk Documents` - Process and index project files
- `PyTypeWizard: Clear Context` - Clear cached context

### Configuration

The extension can be configured through VS Code settings:

```json
{
    "pytypewizard.enableCodeLens": true,
    "pytypewizard.enabledErrorTypes": [
        "Incompatible variable type",
        "Incompatible parameter type",
        "Incompatible return type",
        "Invalid type",
        "Unbound name",
        "Incompatible attribute type"
    ],
    "pytypewizard.ApiKey": "your-api-key-here",
    "pytypewizard.llmProvider": "gemini"
}
```

## Production Deployment

### Package the Extension
```bash
# Install vsce (VS Code Extension Manager)
npm install -g @vscode/vsce

# Package the extension
vsce package

# This creates a .vsix file that can be installed
```

### Install the Package
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Extensions: Install from VSIX"
4. Select the generated `.vsix` file

## Usage

1. Open a Python project in VS Code
2. The extension automatically activates when Python files are detected
3. View type errors in the Problems panel
4. Use quick fixes by clicking on the lightbulb icon
5. Access detailed explanations through the PyTypeWizard sidebar
6. Select code to analyze using CodeLens

## Extension Settings

* `pytypewizard.enableCodeLens`: Enable/disable CodeLens feature
* `pytypewizard.enabledErrorTypes`: Configure which error types to display
* `pytypewizard.ApiKey`: API key for LLM services
* `pytypewizard.llmProvider`: Choose between "gemini" and "openai"

## Architecture

The extension consists of:
- **Core**: Main extension logic, language client, and LLM integration
- **Database**: SQLite-based storage for chunks and solutions
- **Model**: Code action providers, CodeLens, and sidebar
- **GUI**: Svelte-based components for the sidebar interface
- **Scripts**: Python utilities for error extraction and indexing

## Known Issues

- Requires Pyre to be installed and configured in the Python project
- API key required for LLM features
- See our [GitHub issues page](https://github.com/ahmedfahad04/SPL3/issues)

## Release Notes

### 1.0.0
- Initial release
- Core type checking functionality
- Error fixing capabilities
- Interactive sidebar
- LLM integration for intelligent suggestions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See [LICENSE.md](LICENSE.md) for details.

## Contributing

Contributions are welcome! Please check our contribution guidelines.

## License

[MIT](AIzaSyD0dffNomGinWh0Z44fKxBqBY_vTpYQbCY)
[UCB](AIzaSyBDYUajLQgeVcnO3H3XvitRLVexkmOeYxU)
