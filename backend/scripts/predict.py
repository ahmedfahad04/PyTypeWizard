import json
import logging
import os
import re
import subprocess
import sys
import tempfile
from typing import Dict, Final, List

import coloredlogs
from tqdm import tqdm
from transformers import T5ForConditionalGeneration, T5Tokenizer, set_seed
import torch


sys.path.append("..")
from utils import get_current_time

# Setup logging
logger = logging.getLogger(__name__)
coloredlogs.install(
    level="INFO", logger=logger, fmt="%(asctime)s - %(levelname)s - %(message)s"
)

# Global Constants
MODEL_NAME = "../utils/t5base_final"
MODEL_PATH = "../utils/t5base_final/checkpoint-1190"
INPUT_FILE_PATH = "input1.json"  


def process_prediction(code: str) -> str:
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

        for pred_id, code in tqdm(predictions.items(), desc="Validating predictions"):
            processed_code = process_prediction(code)

            with open(temp_file_path, "w") as temp_file:
                temp_file.write(processed_code)

            try:
                result = subprocess.run(
                    ["pyre", "check"], cwd=temp_dir, capture_output=True, text=True
                )
                print('RES: ', result.stderr)
                if result.returncode == 0:
                    valid_predictions.append(pred_id)
            except subprocess.CalledProcessError as e:
                logger.error(f"Error for prediction {pred_id}: {e}")

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
    # Load the tokenizer
    tokenizer = T5Tokenizer.from_pretrained(load_model_path)
    logger.info(f"Loaded tokenizer from directory {load_model_path}")

    # Load the model
    model = T5ForConditionalGeneration.from_pretrained(load_model_path)
    logger.info(f"Loaded model from directory {load_model_path}")
    
    # Determine the device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    logger.info(f"Model is loaded to {device}")

    # Resize the token embeddings and set model to evaluation mode
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


def get_final_predictions(
    max_length: int = 256,
    beam_size: int = 50,
    num_seq: int = 50,
    model_name: str = MODEL_NAME,
    load_model_path: str = MODEL_PATH,
    file_path: str = INPUT_FILE_PATH,
):
    set_seed(42)
    logger.info(f"Start time: {get_current_time()}")

    model, tokenizer = load_model_and_tokenizer(model_name, load_model_path)

    with open(file_path, "r") as f:
        data = json.load(f)
        rule_id = data["rule_id"]
        message = data["message"]
        warning_line = data["warning_line"]
        source_code = data["source_code"]

    input_text = f"fix {rule_id} {message} {warning_line}:\n{source_code}"

    logger.info("Generating predictions...")
    predictions = generate_predictions(
        model, tokenizer, input_text, max_length, beam_size, num_seq
    )
    
    print("Predictions: \n", predictions)

    logger.info("Validating predictions...")
    valid_predictions = validate_predictions(predictions)

    logger.info("Final validated predictions:")
    for k, v in predictions.items():
        if k in valid_predictions:
            logger.info(f"PRED # {k} ANS: \n{process_prediction(v)}")


if __name__ == "__main__":

    get_final_predictions(
        num_seq=10,
        model_name=MODEL_NAME,
        load_model_path=MODEL_PATH,
        file_path=INPUT_FILE_PATH,
    )
