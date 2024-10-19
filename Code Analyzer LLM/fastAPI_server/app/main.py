from fastapi import FastAPI, UploadFile, File
from pathlib import Path
import os
from dotenv import load_dotenv
from utils import initialize_LLM, process_repository, ask_question

# Load environment variables
load_dotenv()

app = FastAPI()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
os.environ["GEMINI_API_KEY"] = GOOGLE_API_KEY

UPLOAD_DIR = "./uploaded_repos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global variable to hold the llm instance after processing
llm_instance = None


@app.post("/upload/")
async def upload_repository(file: UploadFile = File(...)):
    """
    Endpoint to upload a zip file containing the repository, process it, and initialize the LLM.
    """
    global llm_instance

    # Save the uploaded file to a directory
    repo_path = Path(UPLOAD_DIR) / file.filename
    with open(repo_path, "wb") as buffer:
        buffer.write(await file.read())

    # Process the repository (unzip and generate embeddings)
    vectorDb = process_repository(repo_path)

    # Initialize the LLM with vector embeddings
    llm_instance = initialize_LLM(vectorDb)

    return {
        "message": "Repository embedding complete. You can now query the repository."
    }


@app.post("/query/")
async def query_repository(question: str):
    """
    Endpoint to ask a question related to the uploaded and processed repository.
    """
    llm_instance = initialize_LLM(vectorDb)

    if llm_instance is None:
        return {
            "error": "Repository has not been uploaded and processed yet. Please upload a repository first."
        }

    # Query the LLM with the provided question
    answer = ask_question(llm_instance, question)

    return {"answer": answer}
