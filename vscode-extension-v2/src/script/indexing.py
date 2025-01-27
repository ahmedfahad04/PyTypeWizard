from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# FastAPI app
app = FastAPI()


# Data model for requests
class IndexRequest(BaseModel):
    project_path: str


class SearchRequest(BaseModel):
    query: str


# Example endpoints
@app.post("/index")
async def index_project(request: IndexRequest):
    # Placeholder: Simulate indexing
    print("Request: ", request.project_path)
    return {"message": f"Indexing started for project at {request.project_path}"}


@app.post("/search")
async def search_code(request: SearchRequest):
    # Placeholder: Simulate search results
    results = [
        {"file": "example.py", "line": 10, "snippet": "def example_function():"},
    ]
    return {"results": results}


# To run the server:
# uvicorn backend:app --reload
