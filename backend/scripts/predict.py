import argparse
import json
import os
import subprocess
import sys
import tempfile
from typing import Dict, List

sys.path.append("..")

import re

from transformers import T5ForConditionalGeneration, T5Tokenizer, set_seed # type: ignore

from utils import boolean_string, get_current_time


def process_code(code: str) -> str:
    # Split the code into lines
    lines = code.split("\n")

    # Process each line
    processed_lines = []
    for line in lines:
        # Remove spaces before and after the line
        line = line.strip()

        # Replace <IND> with four spaces
        line = line.replace("<IND>", "    ")

        # Replace <DED> by removing four spaces (a tab)
        line = re.sub(r"^<DED>\s{0,4}", "", line)

        processed_lines.append(line)

    # Join the lines back together
    return "\n".join(processed_lines)


#! validate prediction
def validate_predictions(predictions: Dict[str, str]) -> List[str]:
    valid_predictions = []

    # Create a temporary directory to hold our files
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a minimal Pyre configuration file
        with open(os.path.join(temp_dir, ".pyre_configuration"), "w") as config_file:
            config_file.write('{"source_directories": ["."]}\n')

        # Create a single file for all predictions
        temp_file_path = os.path.join(temp_dir, "prediction.py")

        for pred_id, code in predictions.items():
            processed_code = process_code(code)
            print(f"CODE for {pred_id}: {processed_code}")

            # Write the processed code to the file, overwriting its contents
            with open(temp_file_path, "w") as temp_file:
                temp_file.write(processed_code)

            try:
                # Run Pyre check in the temporary directory
                result = subprocess.run(
                    ["pyre", "check"], cwd=temp_dir, capture_output=True, text=True
                )

                print("ISSUE #", pred_id, ">", result.stderr)
                print("\n")

                # If Pyre doesn't report any errors, consider the prediction valid
                if result.returncode == 0:
                    valid_predictions.append(pred_id)

            except subprocess.CalledProcessError as e:
                print(f"Error for prediction {pred_id}: {e}")

    return valid_predictions




def get_single_prediction(
    model, tokenizer, input_text, max_length=256, beam_size=50, num_seq=50
):
    # Tokenize the input text
    input_ids = tokenizer.encode(
        input_text, truncation=True, padding=True, return_tensors="pt"
    ).to(model.device)
    # print("input_ids: ", input_ids)
    # Generate predictions
    beam_outputs = model.generate(
        input_ids,
        max_length=max_length,
        num_beams=beam_size,
        num_return_sequences=num_seq,
        early_stopping=False,
    )
    # Decode the predictions
    predictions = [
        tokenizer.decode(output, skip_special_tokens=True) for output in beam_outputs
    ]

    return predictions


# transformers.logging.set_verbosity_info()
set_seed(42)
print("start time: ", get_current_time())

parser = argparse.ArgumentParser()
parser.add_argument("-bs", "--batch-size", type=int, default=1)
parser.add_argument(
    "-mn",
    "--model-name",
    type=str,
    # choices=["t5-small", "t5-base", "t5-large", "t5-3b", "t5-11b"],
    required=True,
)
parser.add_argument(
    "-lm", "--load-model", type=str, default=""
)  #  Checkpoint dir to load the model. Example: t5-small_global_14-12-2020_16-29-22/checkpoint-10
parser.add_argument(
    "-ea", "--eval-all", type=boolean_string, default=False
)  # to evaluate on all data or not
parser.add_argument("-eas", "--eval-acc-steps", type=int, default=1)
# parser.add_argument("-md", "--model-dir", type=str, default="")
parser.add_argument("-et", "--error-type", type=str, default="")
parser.add_argument(
    "-bm", "--beam-size", type=int, default=50
)  # number of beams to use
parser.add_argument(
    "-seq", "--num-seq", type=int, default=50
)  # number of seq to generate, must be <= number of beams
parser.add_argument(
    "-f",
    "--file_path",
    type=str,
    required=True,
    help="Enter the path to the file containing input.",
)
args = parser.parse_args()

model_name = args.model_name

# Load the tokenizer and the model that will be tested.
tokenizer = T5Tokenizer.from_pretrained(args.load_model)
print("Loaded tokenizer from directory {}".format(args.load_model))
model = T5ForConditionalGeneration.from_pretrained(args.load_model)
print("Loaded model from directory {}".format(args.load_model))
# model.to(f"cuda:{torch.cuda.current_device()}")
model.resize_token_embeddings(len(tokenizer))
model.eval()

with open(args.file_path, "r") as f:
    data = json.load(f)
    rule_id = data["rule_id"]
    message = data["message"]
    warning_line = data["warning_line"]
    source_code = data["source_code"]

input_text = (
    "fix "
    + rule_id
    + " "
    + message
    + " "
    + warning_line
    + ":\n"
    + source_code
    + " </s>"
)

predictions = list(
    get_single_prediction(
        model, tokenizer, input_text, max_length=256, beam_size=50, num_seq=10
    )
)


# Print the predictions
# file_name = time.asctime().split(" ")[-2]
file_name = "pred"
pred_dict = {str(i): value for i, value in enumerate(predictions)}
fp = open(f"output/{file_name}.txt", "w")


print("Input Text:", input_text)
print("Predictions:")

for i, pred in enumerate(predictions):
    print(repr(f'      "{i}": "{pred}"'))
    # fp.write(pred)
    # fp.write('\n')

fp.writelines(predictions)
final_pred = validate_predictions(pred_dict)
print("VALIDATeD: ", final_pred)


print("FINAL: ")
for k, v in pred_dict.items():
    if k in final_pred:
        print("PRED # ", k, " ANS: ", v)
