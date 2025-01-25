import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as vscode from 'vscode';

export class LLMService {
    private genAI!: GoogleGenerativeAI;
    private openAI!: OpenAI;
    private geminiModel: any;
    private selectedProvider: 'gemini' | 'openai' | 'ollama';
    private ollamaEndpoint: string;
    private ollamaModel: string;

    constructor() {
        this.selectedProvider = vscode.workspace.getConfiguration('pytypewizard').get('llmProvider') as 'gemini' | 'openai' | 'ollama';
        this.ollamaEndpoint = vscode.workspace.getConfiguration('pytypewizard').get('ollamaEndpoint') || 'http://localhost:11434';
        this.ollamaModel = vscode.workspace.getConfiguration('pytypewizard').get('ollamaModel') || 'codellama';
        this.initializeProviders();
    }

    private initializeProviders() {
        // Initialize Gemini
        const geminiApiKey = vscode.workspace.getConfiguration('pytypewizard').get('geminiApiKey') as string;
        if (geminiApiKey) {
            this.genAI = new GoogleGenerativeAI(geminiApiKey);
            this.geminiModel = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: "You are an expert Python Type Hint related bug solver. I will provide you code, bug message, add instruction about what to do and you will provide only the updated code snippet and exact, to the point short explanation. No exagerated words is needed.",
            });
        }

        // Initialize OpenAI
        const openaiApiKey = vscode.workspace.getConfiguration('pytypewizard').get('openaiApiKey') as string;
        if (openaiApiKey) {
            this.openAI = new OpenAI({
                apiKey: openaiApiKey
            });
        }
    }

    //! Ollama doesn't work with the current version of the extension
    async generateResponse(prompt: string): Promise<string> {
        this.selectedProvider = vscode.workspace.getConfiguration('pytypewizard').get('llmProvider') as 'gemini' | 'openai' | 'ollama';

        try {
            switch (this.selectedProvider) {
                case 'openai':
                    return await this.generateOpenAIResponse(prompt);
                case 'ollama':
                    return await this.generateOllamaResponse(prompt);
                default:
                    return await this.generateGeminiResponse(prompt);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`${this.selectedProvider.toUpperCase()} API Error: ${error}`);
            return null;
        }
    }

    private async generateOllamaResponse(prompt: string): Promise<string> {
        const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.ollamaModel,
                prompt: `You are an expert Python Type Hint related bug solver. ${prompt}`,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }

    private async generateGeminiResponse(prompt: string): Promise<string> {
        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    private async generateOpenAIResponse(prompt: string): Promise<string> {
        const completion = await this.openAI.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are an expert Python Type Hint related bug solver. Provide only the updated code snippet and exact, to the point short explanation. No exaggerated words needed."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
        });

        return completion.choices[0].message.content;
    }
}

// Singleton instance
let llmInstance: LLMService | null = null;

export function getLLMService(): LLMService {
    if (!llmInstance) {
        llmInstance = new LLMService();
    }
    return llmInstance;
}
