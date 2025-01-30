export interface Solution {
    id: string;
    errorType: string;
    errorMessage: string;
    originalCode: string;
    suggestedSolution: string;
    filePath: string;
    lineNumber: number;
    timestamp: string;
}