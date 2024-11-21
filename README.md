# PyTypeFix: Python Type Fixing with LLM Assistance

## Overview

PyTypeFix is a Visual Studio Code extension that integrates **Pyre** for type checking and leverages Large Language Models (LLMs) to assist in fixing type errors in Python code.

## Motivation

The project aims to streamline the process of identifying and fixing type errors in Python, enhancing code quality and developer productivity. Python type hints are crucial for several reasons:

- **Enhanced Code Quality and Readability:** Type hints make code intentions clearer, improving readability and serving as self-documentation. This leads to easier maintenance, especially in large codebases, and facilitates better collaboration among team members.

- **Improved Development Experience:** With type information, IDEs can provide better autocompletion, refactoring tools, and real-time error detection. This, combined with static analysis tools, significantly enhances the overall development experience and productivity.

- **Early Error Detection and Prevention:** Type checkers like Pyre can catch potential type-related bugs in compile time, reducing the likelihood of production errors. This proactive approach to error detection saves time and resources in the long run.

- **Performance and Optimization:** Some Python implementations can use type information to optimize code execution. Additionally, type hints enable more powerful static analysis, leading to better code quality and potential performance improvements.

- **Gradual Adoption and Flexibility:** Python's approach allows for incremental adoption of type hints, making it feasible to add types to existing codebases over time. This flexibility ensures that developers can gradually improve their codebase without the need for a complete overhaul.

## Modules

The project is typically divided into frontend and backend. As Frontend we are using a VSCode extension and as backend we are using a FastAPI server. To understand the workflow lets deep dive into each of them.

### VSCode Extension

The VSCode extension serves as the frontend interface for PyTypeFix, integrating with Pyre for type checking. Here's a breakdown of its functionality:

- **Language Client Integration:** The extension uses the vscode-languageclient API to communicate with Pyre, enabling real-time type checking and error reporting within VSCode.

- **Pyre Execution Management:** The extension manages Pyre processes, handling initialization, query dispatching, and result parsing.

- **Code Snippet Extraction:** The extension extracts relevant code snippets around identified type errors. This context is used to generate accurate fix suggestions.

- **Diagnostic Presentation:** VSCode's diagnostic API is used to highlight (Squiggle) type errors in the editor, providing immediate feedback to developers.

- **Fix Suggestion Interface:** A WebView interface presents LLM-generated fix suggestions, allowing developers to preview and apply fixes.

- **Asynchronous Communication:** The extension uses asynchronous programming to handle operations like LLM queries without blocking the user interface.

This approach demonstrates the extension's integration with VSCode and its handling of type-related workflows, making PyTypeFix a useful tool for Python development.

### Python Server Backend

This backend server is divided into two parts. In one part, we work with the fine-tuned T5 model, and in another part, we run a FastAPI server to communicate with the model.

Our model is based on the [T5](https://cameronrwolfe.substack.com/p/t5-text-to-text-transformers-part) architecture, which is a Text-to-Text transformer model that leverages the power of **Transfer learning**. The model is first pre-trained on a data-rich task before being fine-tuned on our specific downstream task of fixing Python type errors.

The prediction process, as implemented in `predict.py` in the `backend/src/scripts` directory, follows these steps:

1. **Input Processing**: The script takes the input code snippet and error message, combining them into a single input string formatted for the T5 model.

2. **Model Inference**: The formatted input is passed through the T5 model, which generates a sequence of tokens representing the potential fix.

3. **Output Decoding**: The generated tokens are decoded back into human-readable text, representing the suggested fix for the type error.

4. **Post-processing**: The script applies any necessary post-processing to the model's output, ensuring it's in a format suitable for application to the original code.

5. **Result Propagation**: The processed output is then sent back to the FastAPI server, which in turn communicates it to the VSCode extension for presentation to the user.

This pipeline allows for efficient and accurate generation of type error fixes, leveraging the power of the T5 model while maintaining a clean interface between the model and the rest of the application.

## Installation

## Usage

## Future Work

- Integration with more LLMs for diverse fix suggestions.
- Adding automatic type annotation through the VSCode extension

## Initial Planning

[Workplan](https://docs.google.com/document/d/1KlKjsn5AFJs1EB_KFU0lZRfT7zvXr8WtVh7bwfAcHbE/edit)

## Current Status

**Frontend**: `New-Extension` folder

**Backend**: `backend` folder

Others: Helper folder
