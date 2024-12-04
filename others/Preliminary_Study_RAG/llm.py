from langchain.memory import ConversationSummaryMemory
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from vectorstore_manager import get_vectordb
from langchain.chains import ConversationalRetrievalChain

import os


def initialize_LLM():
    """
    Initializes the Conversational Retrieval Chain (QA system).

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

    # Load vector database
    vectordb = get_vectordb()

    # Initialize memory for conversations
    memory = ConversationSummaryMemory(
        llm=llm, memory_key="chat_history", return_messages=True
    )

    # Create the QA system
    qa = ConversationalRetrievalChain.from_llm(
        llm,
        retriever=vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 8}),
        memory=memory,
    )

    return qa


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
