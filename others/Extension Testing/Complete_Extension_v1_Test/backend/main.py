import ast
import os
from typing import Dict, List, Optional

import chromadb
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FileUpdateRequest(BaseModel):
    file_path: str
    content: str


class WorkspaceRequest(BaseModel):
    workspace_files: Dict[str, str]


class QueryRequest(BaseModel):
    query: str
    workspace_path: Optional[str] = None


class RAGSystem:
    def __init__(self, persist_directory: str = "./vector_db"):
        # Initialize persistent vector store
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection("code_chunks")
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")

    def process_code(self, file_path: str, content: str) -> List[Dict]:
        chunks = []

        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                    try:
                        chunk_content = content[node.lineno - 1 : node.end_lineno]
                        chunks.append(
                            {
                                "content": chunk_content,
                                "file_path": file_path,
                                "start_line": node.lineno,
                                "end_line": node.end_lineno,
                            }
                        )
                    except Exception as e:
                        print(f"Error processing chunk: {e}")
        except Exception:
            # Fallback to line-based chunking
            lines = content.split("\n")
            chunk_size = 20
            for i in range(0, len(lines), chunk_size):
                chunk_content = "\n".join(lines[i : i + chunk_size])
                chunks.append(
                    {
                        "content": chunk_content,
                        "file_path": file_path,
                        "start_line": i + 1,
                        "end_line": min(i + chunk_size, len(lines)),
                    }
                )

        return chunks

    def update_file(self, file_path: str, content: str):
        # Delete existing chunks for this file
        self.collection.delete(where={"file_path": file_path})

        # Process and index new chunks
        chunks = self.process_code(file_path, content)

        if not chunks:
            return

        # Compute embeddings
        embeddings = self.encoder.encode([chunk["content"] for chunk in chunks])

        # Add to vector store
        ids = [
            f"{file_path}_{chunk['start_line']}_{chunk['end_line']}" for chunk in chunks
        ]

        self.collection.add(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=[chunk["content"] for chunk in chunks],
            metadatas=chunks,
        )

    def index_workspace(self, workspace_files: Dict[str, str]):
        for file_path, content in workspace_files.items():
            self.update_file(file_path, content)

    def query_context(self, query: str, top_k: int = 3):
        # Encode query
        query_embedding = self.encoder.encode(query).tolist()

        # Query vector database
        results = self.collection.query(
            query_embeddings=[query_embedding], n_results=top_k
        )

        # Process and return results
        formatted_results = []
        for doc, metadata in zip(results["documents"][0], results["metadatas"][0]):
            formatted_results.append(
                {
                    "content": doc,
                    "file_path": metadata["file_path"],
                    "start_line": metadata["start_line"],
                    "end_line": metadata["end_line"],
                }
            )

        return formatted_results


# Global RAG system instance
rag_system = RAGSystem()


@app.post("/update")
async def update_file(request: FileUpdateRequest):
    rag_system.update_file(request.file_path, request.content)
    return {"status": "success"}


@app.post("/index")
async def index_workspace(request: WorkspaceRequest):
    rag_system.index_workspace(request.workspace_files)
    return {"status": "success"}


@app.post("/query")
async def query_context(request: QueryRequest):
    results = rag_system.query_context(request.query)
    return {"results": results}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
