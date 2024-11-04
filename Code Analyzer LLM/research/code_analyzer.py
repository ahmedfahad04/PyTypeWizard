import os

from dotenv import load_dotenv
from git import Repo
from langchain.chains import ConversationalRetrievalChain
from langchain.document_loaders.generic import GenericLoader
from langchain.document_loaders.parsers import LanguageParser
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.memory import ConversationSummaryMemory
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

# Load environment variables
load_dotenv()

# Global variables
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
REPO_PATH = "test/python-type-hinting-main"  # Default repository path
VECTOR_DB_PATH = "./db"


def clone_repository(repo_url: str, repo_path: str = REPO_PATH) -> None:
    """Clone a repository to the specified local path."""
    if not os.path.exists(repo_path):
        Repo.clone_from(repo_url, to_path=repo_path)
    else:
        print(f"Repository already exists at {repo_path}")


def load_repository_documents(repo_path: str = REPO_PATH):
    """Load Python documents from the specified repository path."""
    loader = GenericLoader.from_filesystem(
        repo_path,
        glob="**/*",
        suffixes=[".py"],
        parser=LanguageParser(language=Language.PYTHON, parser_threshold=500),
    )
    return loader.load()


def split_documents(documents, chunk_size=500, chunk_overlap=20):
    """Split loaded documents into manageable chunks."""
    splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON, chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    return splitter.split_documents(documents)


def initialize_embeddings():
    """Initialize the embedding model."""
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001", google_api_key=GOOGLE_API_KEY
    )


def initialize_vector_db(texts, embedding_model, persist_directory=VECTOR_DB_PATH):
    """Create or load a Chroma vector database from document embeddings."""
    vectordb = Chroma.from_documents(
        texts, embedding=embedding_model, persist_directory=persist_directory
    )
    vectordb.persist()  # Optional: persist the database to disk
    return vectordb


def initialize_llm(temperature=0.5, max_tokens=4018):
    """Initialize the LLM model with Google Generative AI."""
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=temperature,
        max_tokens=max_tokens,
        google_api_key=GOOGLE_API_KEY,
    )


def initialize_conversational_chain(vectordb, llm):
    """Set up the Conversational Retrieval Chain with memory."""
    memory = ConversationSummaryMemory(
        llm=llm, memory_key="chat_history", return_messages=True
    )
    return ConversationalRetrievalChain.from_llm(
        llm,
        retriever=vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 8}),
        memory=memory,
    )


# Core functionality functions


def add_project_repo(repo_url: str = REPO_PATH):
    
    """Clone and load a new repository for analysis."""        
    clone_repository(repo_url)
    documents = load_repository_documents()
    texts = split_documents(documents)
    embedding_model = initialize_embeddings()
    vectordb = initialize_vector_db(texts, embedding_model)
    llm = initialize_llm()
    qa_chain = initialize_conversational_chain(vectordb, llm)
    print("Repository added and processed successfully.")
    
    return qa_chain


def ask_question(qa_chain, question: str):
    """Ask a question to the LLM-based QA system."""
    print("Q: ", question)
    result = qa_chain(question)
    return result["answer"]


def reset_context(qa_chain):
    """Reset the conversational context to start fresh."""
    qa_chain.memory.clear()
    print("Context reset successfully.")


# Example workflow

if __name__ == "__main__":
    # Example usage
    repo_url = "https://github.com/entbappy/End-to-end-Medical-Chatbot-Generative-AI"

    # Step 1: Add repository and initialize QA chain
    qa_chain = add_project_repo()

    # Step 2: Ask a question
    question = """ 
    The following object contains type related issue.
    {rule_id: 'Undefined or invalid type [11]', message: 'Annotation `dict` is not defined as a type.', warning_line: 'def obtain_price_list(self, price_list: dict[str, float]):', source_code: 'No function definition found'}

    You should reply as the following format only. Don't engage in conversation and add any extra explanation.
    1. Cause
    2. Solution in Code
    3. Explain solution in bullet point
    """
    answer = ask_question(qa_chain, question)
    print("Answer:", answer)

    # Step 3: Reset context if needed
    reset_context(qa_chain)
    
    print("============================================================")
    
    answer = ask_question(qa_chain, "Can you name the previous error?")
    print("Answer:", answer)
