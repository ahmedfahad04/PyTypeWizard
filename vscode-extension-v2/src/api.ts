import axios from 'axios';
import * as vscode from 'vscode';
import { outputChannel } from './utils';


export async function sendApiRequest(payload: any) {
    outputChannel.appendLine('Sending data to API...');
    
    const apiUrl = 'http://127.0.0.1:8000/get-fixes';
    const loadingMessage = vscode.window.setStatusBarMessage('Processing data...');

    try {
        const response = await axios.post(apiUrl, payload);

        const solutions = Array.isArray(response.data) ? response.data : [response.data];
        vscode.window.showInformationMessage('Data sent to API successfully!');

        return Object.values(solutions)[0]
    } catch (error) {
        vscode.window.showErrorMessage('Failed to send data to API. Check console for details.');
        return [];
    } finally {
        loadingMessage.dispose();
    }
}
