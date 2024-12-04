import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as vscode from 'vscode';

interface RelevantContext {
    content: string;
    file_path: string;
    start_line: number;
    end_line: number;
    similarity_score: number;
}

interface RAGResponse {
    relevant_contexts: RelevantContext[];
    query: string;
}

export function activate(context: vscode.ExtensionContext) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyAEExJQrlV9np1hENEqKM8uK91824wAuA4');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const RAG_SERVER_URL = 'http://localhost:8000';

    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    // Start RAG server
    const startRAGServer = () => {
        const pythonPath = vscode.workspace.getConfiguration('python').get<string>('pythonPath') || 'python';
        const terminal = vscode.window.createTerminal('RAG Server');
        terminal.sendText(`${pythonPath} -m pip install fastapi uvicorn sentence-transformers scikit-learn`);
        terminal.sendText(`${pythonPath} rag_server.py`);
    };

    let disposable = vscode.commands.registerCommand('vscode-gemini-chat.openChat', () => {
        // Start the RAG server when chat is opened
        // startRAGServer();

        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            currentPanel = vscode.window.createWebviewPanel(
                'geminiChat',
                'Gemini Chat',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            currentPanel.webview.html = getWebviewContent();

            currentPanel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'ask':
                            try {
                                // Get workspace content
                                const workspaceContent = await getWorkspaceContent();

                                // Get relevant context from RAG system
                                const ragResponse = await axios.post<RAGResponse>(`${RAG_SERVER_URL}/query`, {
                                    query: message.text,
                                    workspace_files: workspaceContent
                                });

                                // Format relevant contexts
                                const contextStr = ragResponse.data.relevant_contexts
                                    .map(ctx => `File: ${ctx.file_path} (Lines ${ctx.start_line}-${ctx.end_line})\n\`\`\`\n${ctx.content}\n\`\`\``)
                                    .join('\n\n');

                                // Prepare prompt with relevant context
                                const prompt = `Given the following relevant code context:
                                ${contextStr}
                                
                                Question: ${message.text}
                                
                                Please provide a detailed answer based on the code context. If the context doesn't contain enough information to answer the question, please let me know.`;

                                // Get response from Gemini
                                const result = await model.generateContent(prompt);
                                const response = result.response.text();

                                // Send response back to webview
                                currentPanel?.webview.postMessage({
                                    command: 'response',
                                    text: response
                                });
                            } catch (error) {
                                currentPanel?.webview.postMessage({
                                    command: 'error',
                                    text: 'Error processing your request: ' + error
                                });
                            }
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );

            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );
        }
    });

    context.subscriptions.push(disposable);
}

async function getWorkspaceContent(): Promise<Record<string, string>> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return {};
    }

    const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java,cpp,c,h,hpp,css,html,json}');
    const content: Record<string, string> = {};

    for (const file of files) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            content[file.fsPath] = document.getText();
        } catch (error) {
            console.error(`Error reading file ${file.fsPath}:`, error);
        }
    }

    return content;
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gemini Chat</title>
        <!-- Add marked library for markdown parsing -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.2.12/marked.min.js"></script>
        <!-- Add highlight.js for code syntax highlighting -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
        <style>
            body {
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
            }
            #chat-container {
                display: flex;
                flex-direction: column;
                height: calc(100vh - 40px);
            }
            #messages {
                flex-grow: 1;
                overflow-y: auto;
                margin-bottom: 20px;
                padding: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
            }
            .message {
                margin-bottom: 20px;
                padding: 12px;
                border-radius: 8px;
                max-width: 85%;
            }
            .message-header {
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .user-message {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                align-self: flex-end;
            }
            .assistant-message {
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                color: var(--vscode-editor-foreground);
                align-self: flex-start;
            }
            .markdown-body {
                font-size: 14px;
                line-height: 1.6;
            }
            .markdown-body pre {
                background-color: var(--vscode-editor-background);
                border-radius: 4px;
                padding: 12px;
                overflow-x: auto;
            }
            .markdown-body code {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                font-size: 13px;
            }
            .markdown-body p {
                margin-bottom: 16px;
            }
            #input-container {
                display: flex;
                gap: 10px;
            }
            #question-input {
                flex-grow: 1;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
            }
            button {
                padding: 8px 16px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid var(--vscode-button-foreground);
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            @keyframes spin {
                to {transform: rotate(360deg);}
            }
            .copy-button {
                position: absolute;
                top: 4px;
                right: 4px;
                padding: 4px 8px;
                font-size: 12px;
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                border-radius: 3px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .code-block-wrapper {
                position: relative;
            }
            .code-block-wrapper:hover .copy-button {
                opacity: 1;
            }
            .message-error {
                background-color: var(--vscode-inputValidation-errorBackground);
                color: var(--vscode-inputValidation-errorForeground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
            }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <div id="messages"></div>
            <div id="input-container">
                <input type="text" id="question-input" placeholder="Ask a question about the code...">
                <button onclick="askQuestion()" id="send-button">Send</button>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const messagesContainer = document.getElementById('messages');
            const questionInput = document.getElementById('question-input');
            const sendButton = document.getElementById('send-button');

            // Configure marked options
            marked.setOptions({
                highlight: function(code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return hljs.highlightAuto(code).value;
                },
                breaks: true
            });

            function setLoading(loading) {
                if (loading) {
                    sendButton.innerHTML = '<div class="loading-spinner"></div>Loading...';
                    sendButton.disabled = true;
                    questionInput.disabled = true;
                } else {
                    sendButton.innerHTML = 'Send';
                    sendButton.disabled = false;
                    questionInput.disabled = false;
                }
            }

            function createCodeBlockWrapper(codeElement) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button';
                copyButton.textContent = 'Copy';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(codeElement.textContent).then(() => {
                        copyButton.textContent = 'Copied!';
                        setTimeout(() => {
                            copyButton.textContent = 'Copy';
                        }, 2000);
                    });
                };

                wrapper.appendChild(copyButton);
                wrapper.appendChild(codeElement);
                return wrapper;
            }

            function addMessage(text, type = 'user') {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${type}-message\`;

                const headerDiv = document.createElement('div');
                headerDiv.className = 'message-header';
                headerDiv.textContent = type === 'user' ? '🧑 You' : '🤖 Assistant';
                messageDiv.appendChild(headerDiv);

                const contentDiv = document.createElement('div');
                contentDiv.className = 'markdown-body';

                if (type === 'user') {
                    contentDiv.textContent = text;
                } else if (type === 'error') {
                    contentDiv.textContent = text;
                    messageDiv.classList.add('message-error');
                } else {
                    contentDiv.innerHTML = marked.parse(text);
                    
                    // Add copy buttons to code blocks
                    contentDiv.querySelectorAll('pre code').forEach(codeBlock => {
                        const preElement = codeBlock.parentElement;
                        const wrapper = createCodeBlockWrapper(preElement);
                        preElement.parentElement.replaceChild(wrapper, preElement);
                    });
                }

                messageDiv.appendChild(contentDiv);
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            async function askQuestion() {
                const text = questionInput.value.trim();
                if (text) {
                    addMessage(text, 'user');
                    setLoading(true);
                    
                    vscode.postMessage({
                        command: 'ask',
                        text: text
                    });
                    
                    questionInput.value = '';
                }
            }

            questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion();
                }
            });

            window.addEventListener('message', event => {
                const message = event.data;
                setLoading(false);
                
                switch (message.command) {
                    case 'response':
                        addMessage(message.text, 'assistant');
                        break;
                    case 'error':
                        addMessage(message.text, 'error');
                        break;
                }
            });

            // Initialize with welcome message
            addMessage('👋 Welcome to Gemini Chat! I can help you understand your code repository. Ask me anything about the code!', 'assistant');
        </script>
    </body>
    </html>`;
}

export function deactivate() { }