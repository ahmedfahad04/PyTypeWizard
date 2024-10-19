import ast
import json
import os
import sys
import io
import tokenize


def str_to_token_list(s, line_idx, line_count):
    tokens = []  # list of tokens extracted from source code.
    buf = io.StringIO(s)
    tokens_generator = tokenize.generate_tokens(buf.readline)
    try:
        prev_line = -1
        prev_col_end = -1
        for token in tokens_generator:
            # ignore tokens that are not in our diff and ignore multi-line tokens that go beyond our diff, e.g. multi-line comments
            if not (line_idx <= token[2][0] < line_idx + line_count) or not (
                line_idx <= token[3][0] < line_idx + line_count
            ):
                prev_line = token[3][0]
                prev_col_end = token[3][1]
                continue
            # Calculate the whitespace btw tokens
            if prev_line != -1 and prev_line != token[2][0]:  # new line
                tokens.append(" " * (token[2][1]))
            elif (prev_line != -1 and prev_line == token[2][0]) and (
                prev_col_end != -1 and prev_col_end < token[2][1]
            ):
                tokens.append(" " * (token[2][1] - prev_col_end))
            # if token[1].strip() != '':
            #     tokens.append(token[1])
            # elif token[0] == tokenize.NEWLINE:
            #     tokens.append('NEWLINE')
            tokens.append(token[1])
            if token[0] == tokenize.INDENT:
                tokens.append("<IND>")
            elif token[0] == tokenize.DEDENT:
                tokens.append("<DED>")
            # else:
            #     tokens.append(token[1])
            prev_line = token[3][0]
            prev_col_end = token[3][1]
    # suppress raise from buggy code
    # Note: Exception is only raised at EOF
    except Exception as e:
        print(traceback.format_exc())

    return "".join(tokens)


def count_lines(code: str) -> int:
    return len(code.strip().split("\n"))


def extract_error_info(
    file_path: str,
    err_type: str,
    err_message: str,
    line_num: int,
    col_num: int,
    output_dir: str,
) -> str:
    with open(file_path, "r") as file:
        source_lines = file.readlines()

    # Extract the warning line
    warning_line = source_lines[line_num - 1]

    # Extract the full function or class definition
    start_line = line_num - 1
    while start_line > 0 and not source_lines[start_line].strip().startswith(
        ("def ", "class ")
    ):
        start_line -= 1

    # Include the entire method if the error is in the signature
    end_line = line_num
    if start_line < line_num - 1:  # Error is in the method body
        indent = len(source_lines[start_line]) - len(source_lines[start_line].lstrip())
        while end_line < len(source_lines) and (
            source_lines[end_line].strip() == ""
            or len(source_lines[end_line]) - len(source_lines[end_line].lstrip())
            > indent
        ):
            end_line += 1

    relevant_lines = "".join(source_lines[start_line:end_line])

    # Extract the function definition
    start_line = line_num - 1
    while start_line >= 0 and not source_lines[start_line].startswith("def "):
        start_line -= 1

    if start_line >= 0:
        # Extract the function signature
        signature_line = source_lines[start_line]

        # If the signature is split across multiple lines, include them
        end_line = start_line
        while not signature_line.endswith(":"):
            end_line += 1
            if end_line < len(source_lines):
                signature_line += " " + source_lines[end_line].strip()
            else:
                break

        source_code = signature_line
    else:
        source_code = "No function definition found"

    # Parse the entire file to collect import statements
    try:
        full_tree = ast.parse("".join(source_lines))

        imports = []
        for node in full_tree.body:
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                imports.append(ast.unparse(node))
        imports_code = "\n".join(imports)

    except SyntaxError:
        # If parsing fails, no imports will be added
        imports_code = ""

    # Combine imports with source code
    combined_code = f"{source_code}"

    # Construct the JSON object
    error_info = {
        "rule_id": err_type.strip(),
        "message": err_message.strip(),
        "warning_line": warning_line.strip(),
        "source_code": combined_code,
    }

    return json.dumps(error_info, indent=2)


if __name__ == "__main__":
    if len(sys.argv) != 7:
        print(
            "Usage: python error_extractor.py <file_path> <err_type> <err_message> <line_num> <column_num> <output-dir-path>"
        )
        sys.exit(1)

    file_path = sys.argv[1]
    err_type = sys.argv[2]
    err_message = sys.argv[3]
    line_num = int(sys.argv[4])
    col_num = int(sys.argv[5])
    output_dir = sys.argv[6]

    print(
        extract_error_info(
            file_path, err_type, err_message, line_num, col_num, output_dir
        )
    )

    # print(extract_info(file_path, err_type, err_message, line_num, col_num, output_dir))
