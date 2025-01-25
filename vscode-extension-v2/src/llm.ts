import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as vscode from 'vscode';

export class LLMService {
    private genAI!: GoogleGenerativeAI;
    private openAI!: OpenAI;
    private geminiModel: any;
    private selectedProvider: 'gemini' | 'openai';

    constructor() {
        this.selectedProvider = vscode.workspace.getConfiguration('pytypewizard').get('llmProvider') as 'gemini' | 'openai';
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

    async generateResponse(prompt: string): Promise<string> {
        this.selectedProvider = vscode.workspace.getConfiguration('pytypewizard').get('llmProvider') as 'gemini' | 'openai';

        try {
            if (this.selectedProvider === 'openai') {
                return await this.generateOpenAIResponse(prompt);
            } else {
                return await this.generateGeminiResponse(prompt);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`${this.selectedProvider.toUpperCase()} API Error: ${error}`);
            return null;
        }
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
