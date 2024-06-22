import ast
import json
import sys


def extract_error_info(file_path: str, err_type: str, err_message: str, line_num: int) -> str:
    with open(file_path, 'r') as file:
        source_lines = file.readlines()
   
    # Extract the warning line
    warning_line = source_lines[line_num - 1]
    
    # Extract the full function or class definition
    start_line = line_num - 1
    while start_line > 0 and not source_lines[start_line].strip().startswith(('def ', 'class ')):
        start_line -= 1
    
    relevant_lines = ''.join(source_lines[start_line:line_num])
    
    print("RELEVANT: ", relevant_lines)
    
    # Parse the relevant lines to get the full function or class definition
    try:
        tree = ast.parse(relevant_lines)
        if isinstance(tree.body[0], (ast.FunctionDef, ast.ClassDef)):
            source_code = ast.unparse(tree.body[0])
        else:
            source_code = warning_line
    except SyntaxError:
        # If parsing fails, just use the warning line as source code
        source_code = warning_line
    
    # Construct the JSON object
    error_info = {
        "rule_id": err_type,
        "message": err_message,
        "warning_line": warning_line,
        "source_code": source_code
    }
    
    return json.dumps(error_info, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python error_extractor.py <file_path> <err_type> <err_message> <line_num>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    err_type = sys.argv[2]
    err_message = sys.argv[3]
    line_num = int(sys.argv[4])
    
    result = extract_error_info(file_path, err_type, err_message, line_num)
    print(result)