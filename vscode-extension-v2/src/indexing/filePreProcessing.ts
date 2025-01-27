import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

/**
 * File metadata type for storing relevant file details
 */
export type FileMetadata = {
    filePath: string;
    content: string;
};

/**
 * Asynchronously collects all relevant files from the project workspace.
 * @param excludePatterns - Glob patterns to exclude files (e.g., from `.gitignore` or irrelevant files).
 * @returns Promise containing an array of file paths.
 */
async function collectFiles(excludePatterns: string[]): Promise<string[]> {
    // const includePattern = "**/*"; // Include all files
    const includePattern = "**/*.py"; // Include all Python files
    const exclude = excludePatterns.join(",");

    // Use the VSCode API to find files, excluding irrelevant ones
    const uris = await vscode.workspace.findFiles(includePattern, `{${exclude}}`);
    return uris.map((uri) => uri.fsPath);
}

/**
 * Preprocesses the content of a file by removing comments and docstrings.
 * @param content - Raw file content.
 * @returns Preprocessed file content.
 */
function preprocessFileContent(content: string): string {
    // Remove single-line comments
    let preprocessed = content.replace(/\/\/.*$/gm, "");

    // Remove multi-line comments
    preprocessed = preprocessed.replace(/\/\*[\s\S]*?\*\//g, "");

    // Normalize whitespace
    return preprocessed.trim();
}

/**
 * Reads and preprocesses files, filtering out binary files and irrelevant content.
 * @param filePaths - Array of file paths to process.
 * @returns Array of file metadata with preprocessed content.
 */
async function preprocessFiles(filePaths: string[]): Promise<FileMetadata[]> {
    const fileMetadata: FileMetadata[] = [];

    for (const filePath of filePaths) {
        try {
            const fileExt = path.extname(filePath);

            // Skip binary files (e.g., images, compiled assets)
            if ([".png", ".jpg", ".svg", ".exe", ".dll", ".map"].includes(fileExt)) {
                continue;
            }

            // Read the file content
            const content = await fs.promises.readFile(filePath, "utf-8");

            // Preprocess the content
            const preprocessedContent = preprocessFileContent(content);

            // Skip empty files after preprocessing
            if (preprocessedContent) {
                fileMetadata.push({ filePath, content: preprocessedContent });
            }
        } catch (error) {
            console.error(`Failed to process file ${filePath}:`, error);
        }
    }

    return fileMetadata;
}

/**
 * Main function to execute file collection and preprocessing.
 * @returns Promise containing preprocessed file metadata.
 */
export async function fileCollectionAndPreprocessing(): Promise<FileMetadata[]> {
    // Define files to exclude based on project structure
    const excludePatterns = [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/.vscode/**",
        "**/.gitignore",
        "**/.DS_Store",
        "**/LICENSE.txt",
        "**/*.md",
        "**/*.json",
        "**/*.lock",
        "**/CHANGELOG.md",
        "**/media/**",
        "**/out/compiled/**",
        "**/src/script/__pycache__/**",
    ];

    // Collect files
    const files = await collectFiles(excludePatterns);

    // Preprocess files
    return await preprocessFiles(files);
}