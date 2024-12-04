from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import ast
import re
from pathlib import Path
import uvicorn

app = FastAPI()

class Document:
    def __init__(self, content: str, metadata: Dict):
        self.content = content
        self.metadata = metadata
        self.embedding = None

class CodeChunk:
    def __init__(self, content: str, file_path: str, start_line: int, end_line: int):
        self.content = content
        self.file_path = file_path
        self.start_line = start_line
        self.end_line = end_line

class QueryRequest(BaseModel):
    query: str
    workspace_files: Dict[str, str]  # file_path: content

class QueryResponse(BaseModel):
    relevant_contexts: List[Dict[str, str]]
    query: str

class RAGSystem:
    def __init__(self):
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents: List[Document] = []
        self.chunks: List[CodeChunk] = []

    def process_code(self, file_path: str, content: str) -> List[CodeChunk]:
        chunks = []
        
        # Split code into logical chunks
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    chunk_content = content[node.lineno-1:node.end_lineno]
                    chunks.append(CodeChunk(
                        content=chunk_content,
                        file_path=file_path,
                        start_line=node.lineno,
                        end_line=node.end_lineno
                    ))
        except:
            # Fallback to simple line-based chunking if AST parsing fails
            lines = content.split('\n')
            chunk_size = 20
            for i in range(0, len(lines), chunk_size):
                chunk_content = '\n'.join(lines[i:i + chunk_size])
                chunks.append(CodeChunk(
                    content=chunk_content,
                    file_path=file_path,
                    start_line=i + 1,
                    end_line=min(i + chunk_size, len(lines))
                ))
        
        return chunks

    def index_workspace(self, workspace_files: Dict[str, str]):
        self.documents = []
        self.chunks = []
        
        for file_path, content in workspace_files.items():
            chunks = self.process_code(file_path, content)
            self.chunks.extend(chunks)
            
            for chunk in chunks:
                doc = Document(
                    content=chunk.content,
                    metadata={
                        'file_path': chunk.file_path,
                        'start_line': chunk.start_line,
                        'end_line': chunk.end_line
                    }
                )
                doc.embedding = self.encoder.encode(chunk.content)
                self.documents.append(doc)

    def get_relevant_context(self, query: str, top_k: int = 3) -> List[Dict]:
        if not self.documents:
            return []

        query_embedding = self.encoder.encode(query)
        
        # Calculate similarities
        similarities = [
            cosine_similarity(
                [query_embedding],
                [doc.embedding]
            )[0][0]
            for doc in self.documents
        ]
        
        # Get top-k most similar documents
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        relevant_contexts = []
        for idx in top_indices:
            if similarities[idx] > 0.3:  # Similarity threshold
                doc = self.documents[idx]
                relevant_contexts.append({
                    'content': doc.content,
                    'file_path': doc.metadata['file_path'],
                    'start_line': doc.metadata['start_line'],
                    'end_line': doc.metadata['end_line'],
                    'similarity_score': float(similarities[idx])
                })
        
        return relevant_contexts

rag_system = RAGSystem()

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    # Index the workspace files
    rag_system.index_workspace(request.workspace_files)
    
    # Get relevant context
    relevant_contexts = rag_system.get_relevant_context(request.query)
    
    return QueryResponse(
        relevant_contexts=relevant_contexts,
        query=request.query
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)