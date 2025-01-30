export interface CodeChunk {
    id: string;
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    chunkType: 'function' | 'standalone';
    timestamp: string;
}