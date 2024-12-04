from git import Repo
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers.language.language_parser import (
    LanguageParser,
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.text_splitter import Language

from langchain.memory import ConversationSummaryMemory
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import GoogleGenerativeAIEmbeddings

import os
import zipfile
from pathlib import Path


def process_repository(zip_file_path):
    """
    Unzips the repository and processes the contents to generate embeddings.

    Args:
        zip_file_path (Path): Path to the uploaded zip file.

    Returns:
        qa: An instance of the Conversational Retrieval Chain initialized with the repository embeddings.
    """
    # Unzip the file
    repo_dir = unzip_repository(zip_file_path)

    # Create vector embeddings
    vectordb = create_vectorDb(repo_dir)

    # Initialize LLM and conversation history
    # qa = initialize_LLM(vectordb)

    return vectordb  # Returning the initialized LLM chain


def unzip_repository(zip_file_path):
    """
    Unzips the uploaded zip file to a directory.

    Args:
        zip_file_path (Path): Path to the uploaded zip file.

    Returns:
        repo_dir (Path): Path to the unzipped repository directory.
    """
    repo_dir = Path(zip_file_path).stem
    extract_dir = Path(f"./uploaded_repos/{repo_dir}")
    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
        zip_ref.extractall(extract_dir)

    print(f"Unzipped repository to: {extract_dir}")
    return extract_dir


def initialize_LLM(vectordb):
    """
    Initializes the Conversational Retrieval Chain (QA system) using the provided vector database.

    Args:
        vectordb: The vector database created from repository embeddings.

    Returns:
        qa: An instance of the Conversational Retrieval Chain.
    """
    # Initialize the LLM (Google Generative AI)
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.3,
        max_tokens=500,
        google_api_key=GOOGLE_API_KEY,
    )

    # Initialize memory for conversations
    memory = ConversationSummaryMemory(
        llm=llm, memory_key="chat_history", return_messages=True
    )

    # Create the QA system with vector-based retrieval
    qa = ConversationalRetrievalChain.from_llm(
        llm,
        retriever=vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 8}),
        memory=memory,
    )

    return qa


def create_vectorDb(repo_path):
    """
    Initializes and returns the vector store using Chroma and Google Generative AI embeddings.

    Args:
        repo_path: Path to the repository.

    Returns:
        vectordb: The initialized vector store (Chroma).
    """
    # Load documents from the repository
    documents = load_documents(repo_path)
    texts = split_documents(documents)

    # Initialize embeddings using Google Generative AI
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001", google_api_key=GOOGLE_API_KEY
    )

    # Initialize vector store (Chroma)
    vectordb = Chroma.from_documents(
        texts, embedding=embeddings, persist_directory="./db"
    )

    return vectordb


def clone_repository(repo_url, repo_path):
    """
    Clones the repository from the given URL to the specified path.

    Args:
        repo_url: URL of the repository to clone.
        repo_path: Path where the repository should be cloned.
    """
    Repo.clone_from(repo_url, to_path=repo_path)


def load_documents(repo_path):
    """
    Loads and parses Python documents from the repository.

    Args:
        repo_path: Path to the repository containing Python files.

    Returns:
        documents: A list of loaded documents.
    """
    loader = GenericLoader.from_filesystem(
        repo_path,
        glob="**/*",
        suffixes=[".py"],
        parser=LanguageParser(language=Language.PYTHON, parser_threshold=500),
    )
    return loader.load()


def split_documents(documents):
    """
    Splits loaded documents into chunks.

    Args:
        documents: The documents to split.

    Returns:
        texts: A list of split document texts.
    """
    documents_splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON, chunk_size=500, chunk_overlap=20
    )
    return documents_splitter.split_documents(documents)


def ask_question(qa, question):
    """
    Queries the QA system with the given question.

    Args:
        qa: The initialized QA system.
        question: The question string to be asked.

    Returns:
        answer: The answer string retrieved from the QA system.
    """
    result = qa(question)
    return result["answer"]


#! will start from here
def get_embeddings_from_vectordb():
    
    pass 

