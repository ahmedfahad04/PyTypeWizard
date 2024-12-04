import subprocess
import sys

from dask import compute, delayed


@delayed
def extract_error_log():
    file_path = "/home/fahad/Documents/Projects/SPL3/workspace/example1.py"
    err_type = "Incompatible return type [7]"
    err_message = "Expected `Tuple[str, str]` but got `Tuple[str, int]`"
    line_num = "5"
    col_num = "12"
    output_dir = "input"

    result = subprocess.run(
        [
            "python",
            "error_extractor.py",
            file_path,
            err_type,
            err_message,
            line_num,
            col_num,
            output_dir,
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    print("OUT: ", result.stdout)
    return result.stdout


@delayed
def predict_solution(file_path):

    result = subprocess.run(
        [
            "python",
            "pyty_predict.py",
            "-mn",
            "t5base_final",
            "-lm",
            "t5base_final/checkpoint-1190",
            "-f",
            file_path.strip(),
            "-bm",
            "5",
            "-seq",
            "5",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    print("OUTPUT: ", result.stdout)
    # print("ERROR: ", result.stderr)

    # Return whatever output you need from this step
    return result.stdout


def main():

    # Define the pipeline
    file_path = extract_error_log()
    predicted_file = predict_solution(file_path)

    # Execute the pipeline
    compute(predicted_file)


if __name__ == "__main__":

    main()
