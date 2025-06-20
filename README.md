# PyTypeWizard 🪄

> A powerful Visual Studio Code extension for Python static type checking and intelligent error fixing

## Python Type Error Resolution with AI Assistance

PyTypeWizard is a comprehensive VS Code extension that integrates **Pyre** static type checker with advanced Large Language Models (LLMs) to automatically detect and fix Python type errors with intelligent suggestions.

## ✨ Key Features

- 🎯 **Real-time Type Checking**: Integrated Pyre static analysis for immediate error detection
- 🤖 **AI-Powered Fixes**: LLM integration (Gemini/OpenAI) for intelligent type error resolution
- 📋 **Interactive Dashboard**: Comprehensive sidebar with error history and management
- 🔍 **Smart Code Analysis**: Advanced code chunking and context-aware suggestions
- ⚡ **CodeLens Integration**: Quick fixes directly in the editor with one-click application
- 🛠️ **Configurable Settings**: Customizable error types and LLM provider selection
- 📊 **Solution History**: Track and review past fixes and improvements

## 🛠️ Installation & Setup

### Prerequisites
- **VS Code** (version 1.96.0 or higher)
- **Python** (version 3.6 or higher)
- **Node.js** (version 14 or higher)

### Quick Installation
1. **Install Dependencies**:
   ```bash
   cd vscode-extension-v2
   npm install
   ```

2. **Build the Extension**:
   ```bash
   npm run compile
   ```

3. **Launch Development Mode**:
   - Press `F5` in VS Code
   - Or use `Run > Start Debugging`
   - Extension Development Host window will open

### Package for Production
```bash
# Install packaging tool
npm install -g @vscode/vsce

# Create .vsix package
vsce package

# Install via VS Code Command Palette
# Extensions: Install from VSIX
```

## 🚀 Usage

### Getting Started
1. **Open a Python Project** in the Extension Development Host
2. **Configure API Key** in VS Code Settings (`pytypewizard.ApiKey`)
3. **Select LLM Provider** (Gemini or OpenAI)
4. **Open Python Files** with type errors

### Core Functionality
- **Automatic Detection**: Type errors appear in Problems panel
- **Quick Fixes**: Click lightbulb icons or use CodeLens
- **Sidebar Dashboard**: Access comprehensive error management
- **Code Selection**: Select code snippets for targeted analysis

### Available Commands
- `PyTypeWizard: Show History` - View solution history
- `PyTypeWizard: Open Settings` - Configure extension preferences
- `PyTypeWizard: Chunk Documents` - Index project for better context
- `PyTypeWizard: Clear Context` - Reset cached data

## ⚙️ Configuration

Configure the extension through VS Code Settings:

```json
{
    "pytypewizard.enableCodeLens": true,
    "pytypewizard.llmProvider": "gemini",
    "pytypewizard.ApiKey": "your-api-key-here",
    "pytypewizard.enabledErrorTypes": [
        "Incompatible variable type",
        "Incompatible parameter type", 
        "Incompatible return type",
        "Invalid type",
        "Unbound name",
        "Incompatible attribute type"
    ]
}
```

## 🏗️ Architecture

### Extension Components
- **Core Engine**: Main extension logic and Pyre integration
- **LLM Integration**: AI-powered suggestion generation
- **Database Layer**: SQLite storage for chunks and solutions
- **GUI Framework**: Svelte-based interactive sidebar
- **Code Analysis**: Advanced Python AST parsing and context extraction

### Supported Error Types
- Incompatible variable types
- Parameter type mismatches
- Return type inconsistencies
- Invalid type annotations
- Unbound variable references
- Attribute type conflicts

## 🛣️ Roadmap

- [ ] Enhanced multi-file type analysis
- [ ] Batch error processing capabilities
- [ ] Integration with additional static analyzers
- [ ] Advanced refactoring suggestions
- [ ] Team collaboration features
- [ ] Performance optimization for large codebases

## � Documentation

- [Execution Guide](vscode-extension-v2/EXECUTION_GUIDE.md) - Detailed setup and usage instructions
- [Package Configuration](vscode-extension-v2/package.json) - Extension manifest and dependencies
- [Changelog](vscode-extension-v2/CHANGELOG.md) - Version history and updates

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly with the development setup
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](vscode-extension-v2/LICENSE.md) file for details.
