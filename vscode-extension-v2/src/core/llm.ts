import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as vscode from 'vscode';
import { pyreTypeErrorsExplanation } from './prompt';

export class LLMService {
    private genAI!: GoogleGenerativeAI;
    private openAI!: OpenAI;
    private geminiModel: any;
    private selectedProvider: 'gemini' | 'openai';
    public conversationHistory: Array<{ role: string, parts: any[] }> = [];


    constructor() {
        this.selectedProvider = vscode.workspace.getConfiguration('pytypewizard').get('llmProvider') as 'gemini' | 'openai';
        this.initializeProviders();
    }

    private initializeProviders() {
        // Initialize Gemini
        const apiKey = vscode.workspace.getConfiguration('pytypewizard').get('ApiKey') as string;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.geminiModel = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp", // gemini-2.0-flash-thinking-exp-01-21
                systemInstruction: `You are an expert in solving Python type hint-related bugs. I will provide you with code snippets and corresponding bug messages. Your task is to analyze these and provide solutions based on the descriptions of type errors from Pyre's documentation. But never alter anything from the source code that alters the functionality or breaks the code. Please refer to the following Pyre type error explanations when formulating your responses:

                ${pyreTypeErrorsExplanation}
                
                Try to keep the explanation concise and to the point. Do not include any unnecessary information.
                `,

            });
        }

        // Initialize OpenAI
        if (apiKey) {
            this.openAI = new OpenAI({
                apiKey: apiKey
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

        this.conversationHistory.push({ role: "user", parts: [{ text: prompt }] });

        const chatSession = this.geminiModel.startChat({
            history: this.conversationHistory
        });

        const result = await chatSession.sendMessage(prompt);
        const responseText = result.response.text();

        this.conversationHistory.push({
            role: "model",
            parts: [{ text: responseText }]
        });


        return responseText;
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

    public clearConversationHistory(): void {
        this.conversationHistory = [];
        this.initializeProviders();
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
