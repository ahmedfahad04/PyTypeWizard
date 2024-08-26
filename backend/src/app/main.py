import os
import sys

from fastapi import FastAPI
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

@app.get("/")
def read_root():
    return "Welcome to PyTyFix"


@app.post("/get-fixes")
def get_type_fixes(input_obj: ModelInput):
    preds = get_final_predictions(
        data=input_obj.model_dump()
    )
    
    output_obj = {
        'fix': preds,
    }
    
    return output_obj 
