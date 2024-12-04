from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from utils import load_documents, split_documents
import os

def get_vectordb():
    """
    Initializes and returns the vector store using Chroma and Google Generative AI embeddings.

    Returns:
        vectordb: The initialized vector store (Chroma).
    """
    # Load documents from the repository
    repo_path = "test_repo/"
    documents = load_documents(repo_path)
    texts = split_documents(documents)

    # Initialize embeddings using Google Generative AI
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)

    # Initialize vector store (Chroma)
    vectordb = Chroma.from_documents(texts, embedding=embeddings, persist_directory='./db')
    
    return vectordb
