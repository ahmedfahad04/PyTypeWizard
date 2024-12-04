import os
from typing import Dict, List

from fastapi import BackgroundTasks, FastAPI, HTTPException
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationSummaryMemory
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers.language.language_parser import (
    LanguageParser,
)
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from pydantic import BaseModel

# API Key for LLM
GOOGLE_API_KEY = "AIzaSyA8gArB1O3XkiuIdms_J9vD-uBCIWkx5Gw"

# Initialize FastAPI app
app = FastAPI()

# Configuration Constants
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
VECTOR_DB_PATH = "./vector_db"
EMBEDDING_MODEL = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001", google_api_key=GOOGLE_API_KEY
)

# Initialize or Load VectorStore
if not os.path.exists(VECTOR_DB_PATH):
    os.makedirs(VECTOR_DB_PATH)
    
vectordb = Chroma(persist_directory=VECTOR_DB_PATH, embedding_function=EMBEDDING_MODEL)

# LLM Initialization
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    temperature=0.5,
    max_tokens=4018,
    google_api_key=GOOGLE_API_KEY,
)


# Models
class IndexRequest(BaseModel):
    project_path: str
    file_patterns: List[str] = ["**/*.py"]
    errors: List[Dict]  # New: Include error metadata


class QueryRequest(BaseModel):
    question: str
    error_details: Dict  # New: Include error details


# Utility Functions
def index_project(project_path: str, file_patterns: List[str], errors: List[Dict]):
    """
    Index the project by splitting Python code into chunks and embedding
    the chunks along with error metadata.
    """
    loader = GenericLoader.from_filesystem(
        project_path,
        glob=file_patterns[0],
        suffixes=[".py"],
        parser=LanguageParser(language=Language.PYTHON, parser_threshold=500),
    )
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    chunks = splitter.split_documents(documents)

    # # Append error metadata to each document's content
    # for chunk in chunks:
    #     for error in errors:
    #         if error["file"] in chunk.metadata["source"]:
    #             chunk.page_content += f"\n\nError Details:\n{error}"

    # Store embeddings in the vector DB
    vectordb = Chroma.from_documents(
        chunks, embedding=EMBEDDING_MODEL, persist_directory=VECTOR_DB_PATH
    )
    # vectordb.persist()


def query_vectorstore(question: str, error_details: Dict) -> str:
    """
    Query the vector store and retrieve relevant context for the LLM.
    """
    retriever = vectordb.as_retriever()
    memory = ConversationSummaryMemory(
        llm=llm, memory_key="chat_history", return_messages=True
    )

    # Construct detailed question with error context
    detailed_question = (
        # f"Fix the following error in the Python code:\n"
        # f"Error: {error_details['message']}\n"
        # f"File: {error_details['file']}, Line: {error_details['line']}\n\n"
        f"{question}"
    )

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
    )
    response = chain({"question": detailed_question})
    return response["answer"]





# Endpoints
@app.post("/index")
async def index_codebase(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Endpoint to index the codebase and include error metadata for context.
    """
    try:
        if not os.path.exists(request.project_path):
            raise HTTPException(status_code=400, detail="Project path does not exist")

        background_tasks.add_task(
            index_project, request.project_path, request.file_patterns, request.errors
        )

        return {"message": "Indexing started in the background"}
    except Exception as e:
        return {"message": f"Failed to index: {str(e)}"}


@app.post("/query")
async def query_codebase(request: QueryRequest):
    """
    Endpoint to query the codebase with error details and receive a fix.
    """
    try:
        response = query_vectorstore(request.question, request.error_details)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status")
async def get_status():
    """
    Endpoint to check the server status.
    """
    return {"status": "Ready"}
