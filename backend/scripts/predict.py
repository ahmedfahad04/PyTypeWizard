import json
import os
import re
import subprocess
import sys
import tempfile
from typing import Dict, List

from transformers import T5ForConditionalGeneration, T5Tokenizer, set_seed # type: ignore

sys.path.append("..")
from utils import boolean_string, get_current_time


def process_code(code: str) -> str:
    lines = code.split("\n")
    processed_lines = [
        re.sub(r"^<DED>\s{0,4}", "", line.strip().replace("<IND>", "    "))
        for line in lines
    ]
    return "\n".join(processed_lines)


def validate_predictions(predictions: Dict[str, str]) -> List[str]:
    valid_predictions = []

    with tempfile.TemporaryDirectory() as temp_dir:
        with open(os.path.join(temp_dir, ".pyre_configuration"), "w") as config_file:
            config_file.write('{"source_directories": ["."]}\n')

        temp_file_path = os.path.join(temp_dir, "prediction.py")

        for pred_id, code in predictions.items():
            processed_code = process_code(code)
            print(f"CODE for {pred_id}: {processed_code}")

            with open(temp_file_path, "w") as temp_file:
                temp_file.write(processed_code)

            try:
                result = subprocess.run(
                    ["pyre", "check"], cwd=temp_dir, capture_output=True, text=True
                )
                print("ISSUE #", pred_id, ">", result.stderr)
                print("\n")
                if result.returncode == 0:
                    valid_predictions.append(pred_id)
            except subprocess.CalledProcessError as e:
                print(f"Error for prediction {pred_id}: {e}")

    return valid_predictions


def get_single_prediction(
    model, tokenizer, input_text, max_length=256, beam_size=50, num_seq=50
) -> List[str]:
    input_ids = tokenizer.encode(
        input_text, truncation=True, padding=True, return_tensors="pt"
    ).to(model.device)

    beam_outputs = model.generate(
        input_ids,
        max_length=max_length,
        num_beams=beam_size,
        num_return_sequences=num_seq,
        early_stopping=False,
    )

    return [
        tokenizer.decode(output, skip_special_tokens=True) for output in beam_outputs
    ]


def load_model_and_tokenizer(model_name: str, load_model_path: str):
    tokenizer = T5Tokenizer.from_pretrained(load_model_path)
    print(f"Loaded tokenizer from directory {load_model_path}")
    
    model = T5ForConditionalGeneration.from_pretrained(load_model_path)
    print(f"Loaded model from directory {load_model_path}")
    
    model.resize_token_embeddings(len(tokenizer))
    model.eval()
    
    return model, tokenizer


def generate_predictions(
    model, tokenizer, input_text: str, max_length=256, beam_size=50, num_seq=10
) -> Dict[str, str]:
    predictions = get_single_prediction(
        model, tokenizer, input_text, max_length, beam_size, num_seq
    )
    return {str(i): value for i, value in enumerate(predictions)}


def main(
    model_name: str,
    load_model_path: str,
    file_path: str,
    max_length: int = 256,
    beam_size: int = 50,
    num_seq: int = 50,
    eval_all: bool = False,
    eval_acc_steps: int = 1,
    error_type: str = "",
):
    set_seed(42)
    print("start time: ", get_current_time())

    model, tokenizer = load_model_and_tokenizer(model_name, load_model_path)

    with open(file_path, "r") as f:
        data = json.load(f)
        rule_id = data["rule_id"]
        message = data["message"]
        warning_line = data["warning_line"]
        source_code = data["source_code"]

    input_text = f"fix {rule_id} {message} {warning_line}:\n{source_code} </s>"

    predictions = generate_predictions(
        model, tokenizer, input_text, max_length, beam_size, num_seq
    )

    print('PRED: ', predictions)

    valid_predictions = validate_predictions(predictions)
    print("VALIDATED: ", valid_predictions)

    print("FINAL: ")
    for k, v in predictions.items():
        if k in valid_predictions:
            print(f"PRED # {k} ANS: {v}")


# Example of how to call the main function from another part of your code or an API
if __name__ == "__main__":
    model_name = "../utils/t5base_final"  # replace with your model name
    load_model_path = "../utils/t5base_final/checkpoint-1190"  # replace with your model path
    file_path = "input1.json"  # replace with your input file path
    
    main(
        model_name=model_name,
        load_model_path=load_model_path,
        file_path=file_path,
        max_length=256,
        beam_size=50,
        num_seq=10,
        eval_all=False,
        eval_acc_steps=1,
        error_type="",
    )
