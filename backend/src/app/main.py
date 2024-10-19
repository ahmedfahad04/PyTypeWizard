import asyncio
import os
import sys

from fastapi import FastAPI, Query
from pydantic import BaseModel

# Add src/scripts to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "scripts"))

# Now import the function
from predict import get_final_predictions

app = FastAPI()


class ModelInput(BaseModel):
    rule_id: str
    message: str
    warning_line: str
    source_code: str


async def generate_prediction(input_obj, num_seq, beam_size):
    # Run the blocking function in a separate thread to avoid blocking the event loop
    preds = await asyncio.to_thread(
        get_final_predictions,
        data=input_obj.model_dump(),
        num_seq=num_seq,
        beam_size=beam_size,
    )

    output_obj = {
        "fix": preds,
    }

    return output_obj


@app.get("/")
def read_root():
    return "Welcome to PyTyFix"


@app.post("/get-fixes")
async def get_type_fixes(
    input_obj: ModelInput,
    num_seq: int = Query(10, ge=10, le=50),
    beam_size: int = Query(10, ge=10, le=50),
):
    # Run multiple tasks concurrently using asyncio.gather
    results = await asyncio.gather(
        generate_prediction(input_obj, num_seq, beam_size),
    )
    return results
