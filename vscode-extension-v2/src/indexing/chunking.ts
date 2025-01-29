import { promises as fsPromises } from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import { outputChannel } from "../utils";

export async function findPythonFiles(rootDir: string): Promise<string[]> {
    const pythonFiles: string[] = [];

    async function traverseDirectory(dir: string) {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await traverseDirectory(fullPath);
            } else if (entry.isFile() && fullPath.endsWith(".py")) {
                pythonFiles.push(fullPath);
            }
        }
    }

    await traverseDirectory(rootDir);
    return pythonFiles;
}


async function splitPythonCodeOptimally(filePath: string, fileContent: string): Promise<{
    content: string;
    metadata: {
        filePath: string;
        startLine: number;
        endLine: number;
        type: 'function' | 'standalone'
    }
}[]> {
    const lines = fileContent.split("\n");
    const chunks: {
        content: string;
        metadata: {
            filePath: string;
            startLine: number;
            endLine: number;
            type: 'function' | 'standalone'
        }
    }[] = [];

    let currentChunk: string[] = [];
    let standaloneChunk: string[] = [];
    let startLine = 0;
    let inFunction = false;
    let currentIndentation = 0;

    const flushFunctionChunk = (endLine: number) => {
        if (currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join("\n"),
                metadata: {
                    filePath,
                    startLine: startLine + 1,
                    endLine,
                    type: 'function'
                }
            });
            currentChunk = [];
        }
    };

    const flushStandaloneChunk = (endLine: number) => {
        if (standaloneChunk.length > 0) {
            chunks.push({
                content: standaloneChunk.join("\n"),
                metadata: {
                    filePath,
                    startLine: startLine + 1,
                    endLine,
                    type: 'standalone'
                }
            });
            standaloneChunk = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) continue;

        // Detect function definitions
        if (/^\s*def\s+\w+/.test(line)) {
            // Flush any standalone statements before the function
            if (standaloneChunk.length > 0) {
                flushStandaloneChunk(i - 1);
            }

            flushFunctionChunk(i - 1);
            startLine = i;
            inFunction = true;
            currentIndentation = line.length - line.trimLeft().length;
            currentChunk.push(line);
            continue;
        }

        // Check if we're still in a function
        if (inFunction) {
            const lineIndentation = line.length - line.trimLeft().length;
            if (lineIndentation > currentIndentation) {
                currentChunk.push(line);
            } else {
                inFunction = false;
                flushFunctionChunk(i - 1);
                if (trimmedLine) {
                    startLine = i;
                    standaloneChunk.push(line);
                }
            }
        } else {
            // Collect standalone statements
            if (trimmedLine && !/^\s*def\s+\w+/.test(line)) {
                if (standaloneChunk.length === 0) {
                    startLine = i;
                }
                standaloneChunk.push(line);
            }
        }
    }

    // Flush any remaining chunks
    if (inFunction) {
        flushFunctionChunk(lines.length);
    }
    if (standaloneChunk.length > 0) {
        flushStandaloneChunk(lines.length);
    }

    // outputChannel.appendLine(`Split ${filePath} into ${chunks.length} chunks`);
    return chunks;
}

async function readPythonFilesConcurrently(files: string[]): Promise<{
    fileContents: Map<string, string>,
    totalCharacters: number,
    maxChars: number,
    chunks: Array<{
        content: string;
        metadata: {
            filePath: string;
            startLine: number;
            endLine: number
            type: 'function' | 'standalone'

        }
    }>
}> {
    const fileContents = new Map<string, string>();
    let totalCharacters = 0;
    let maxChars = 0;
    let chunks: Array<{
        content: string; metadata: {
            filePath: string; startLine: number; endLine: number, type: 'function' | 'standalone'
        }
    }> = [];

    const concurrencyLimit = 100;
    const batches = Array.from(
        { length: Math.ceil(files.length / concurrencyLimit) },
        (_, i) => files.slice(i * concurrencyLimit, (i + 1) * concurrencyLimit)
    );

    for (const batch of batches) {
        const readOperations = batch.map(async (filePath) => {
            try {
                const content = await fsPromises.readFile(filePath, "utf-8");
                fileContents.set(filePath, content);

                const fileChunks = await splitPythonCodeOptimally(filePath, content);
                chunks.push(...fileChunks);

                totalCharacters += content.length;
                maxChars = Math.max(maxChars, content.length);

                return { content, chunks: fileChunks };
            } catch (error) {
                outputChannel.appendLine(`Failed to read file: ${filePath} - ${error}`);
                return null;
            }
        });

        await Promise.all(readOperations);
    }

    return { fileContents, totalCharacters, maxChars, chunks };
}


export async function processPythonFiles(rootDir: string) {
    // outputChannel.appendLine("Finding Python files...");
    // const pythonFiles = await findPythonFiles(rootDir);

    // outputChannel.appendLine("Reading Python files concurrently...");
    // const result = await readPythonFilesConcurrently(pythonFiles);
    // outputChannel.appendLine(`Successfully read ${result.fileContents.size} Python files with ${result.chunks.length} chunks.`);

    const response = await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: '',
            cancellable: false,
        },
        async (progress, token) => {
            progress.report({ message: 'Indexing Python Files...' });

            // Check for cancellation before making the API call
            if (token.isCancellationRequested) {
                return null;
            }

            const pythonFiles = await findPythonFiles(rootDir);
            vscode.window.showInformationMessage(`Found ${pythonFiles.length} Python files.`);

            const result = await readPythonFilesConcurrently(pythonFiles);

            // Check for cancellation after getting the response
            if (token.isCancellationRequested) {
                return null;
            }

            return result;
        }
    );

    return response;
}

