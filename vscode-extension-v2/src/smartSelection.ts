interface Position {
    line: number;
    character: number;
}

interface Range {
    start: Position;
    end: Position;
}

interface TextDocument {
    lineAt(line: number): { text: string };
    lineCount: number;
}

export function getSimplifiedSmartSelection(document: TextDocument, target: Position): Range | undefined {
    // Function to check if a line is a function signature (assumes it starts with a keyword like 'function')
    const isFunctionSignature = (line: string) => /\bfunction\b|\basync\b|\bclass\b/.test(line);

    // Function to check if a line is empty or only contains whitespace
    const isEmptyLine = (line: string) => /^\s*$/.test(line);

    // Find the start of the block (first non-empty line above target or a function signature)
    let startLine = target.line;
    while (startLine > 0 && !isFunctionSignature(document.lineAt(startLine - 1).text) && !isEmptyLine(document.lineAt(startLine - 1).text)) {
        startLine--;
    }

    // Find the end of the block (first empty line below target, but allow blank lines within function signatures)
    let endLine = target.line;
    while (endLine < document.lineCount - 1 && (!isEmptyLine(document.lineAt(endLine + 1).text) || isFunctionSignature(document.lineAt(endLine + 1).text))) {
        endLine++;
    }

    // Ensure we include function signatures even if the block starts with them
    if (isFunctionSignature(document.lineAt(startLine).text)) {
        while (startLine > 0 && isEmptyLine(document.lineAt(startLine - 1).text)) {
            startLine--;
        }
    }

    // Create and return the range
    return {
        start: { line: startLine, character: 0 },
        end: { line: endLine, character: document.lineAt(endLine).text.length }
    };
}
