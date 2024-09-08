import axios from 'axios';
import * as vscode from 'vscode';

let outputChannel = vscode.window.createOutputChannel("pyre");

export async function sendApiRequest(payload: any) {
    const apiUrl = 'http://127.0.0.1:8000/get-fixes';
    const loadingMessage = vscode.window.setStatusBarMessage('Sending data to API...');

    try {
        const response = await axios.post(apiUrl, payload);
        outputChannel.appendLine(JSON.stringify(response.data));
        vscode.window.showInformationMessage('Data sent to API successfully!');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to send data to API. Check console for details.');
    } finally {
        loadingMessage.dispose();
    }
}