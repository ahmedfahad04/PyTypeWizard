import { GoogleGenerativeAI } from '@google/generative-ai';
import * as vscode from 'vscode';

export class GeminiService {
    private genAI!: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = vscode.workspace.getConfiguration('pytypewizard').get('geminiApiKey') as string;
        if (!apiKey) {
            vscode.window.showErrorMessage('Please set Gemini API key in settings');
            return;
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: "You are an expert Python Type Hint related bug solver. I will provide you code, bug message, add instruction about what to do and you will provide only the updated code snippet and exact, to the point short explanation. No exagerated words is needed.",
        });
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            vscode.window.showErrorMessage(`Gemini API Error: ${error}`);
            return null;
        }
    }
}

// Singleton instance
let geminiInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
    if (!geminiInstance) {
        geminiInstance = new GeminiService();
    }
    return geminiInstance;
}
