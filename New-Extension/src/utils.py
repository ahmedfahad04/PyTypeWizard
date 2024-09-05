

def parse_pyre_output(output):
    
    parts = output.split(':')
    
    file_name = parts[0]
    line_number = parts[1]
    col_number = parts[2].split(' ')[0]
    err_type = ' '.join(parts[2].split(' ')[1:])
    
    err_msg = ':'.join(parts[3:]).strip()
    
    return file_name, line_number, col_number, err_type, err_msg

    
# Example usage
# file_name, line_number, col_number, err_type, err_msg = parse_pyre_output("test2.py:25:4 Incompatible return type [7]: Expected `Tuple[str, str]` but got `Tuple[str, int]`")
# print(f"File Name: {file_name}")
# print(f"Line Number: {line_number}")
# print(f"Column Number: {col_number}")
# print(f"Error Type: {err_type}")
# print(f"Error Message: {err_msg}")
