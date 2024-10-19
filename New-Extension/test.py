# import io
# import tokenize
# import traceback
# import unittest

# def str_to_token_list(s, line_idx, line_count):
#     tokens = []  # list of tokens extracted from source code.
#     buf = io.StringIO(s)
#     tokens_generator = tokenize.generate_tokens(buf.readline)

#     try:
#         prev_line = -1
#         prev_col_end = -1
#         for token in tokens_generator:
#             # ignore tokens that are not in our diff and ignore multi-line tokens that go beyond our diff, e.g. multi-line comments
#             if not (line_idx <= token[2][0] < line_idx + line_count) or not (
#                 line_idx <= token[3][0] < line_idx + line_count
#             ):
#                 prev_line = token[3][0]
#                 prev_col_end = token[3][1]
#                 continue

#             # Calculate the whitespace btw tokens
#             if prev_line != -1 and prev_line != token[2][0]:  # new line
#                 tokens.append(" " * (token[2][1]))
#             elif (prev_line != -1 and prev_line == token[2][0]) and (
#                 prev_col_end != -1 and prev_col_end < token[2][1]
#             ):
#                 tokens.append(" " * (token[2][1] - prev_col_end))

#             # if token[1].strip() != '':
#             #     tokens.append(token[1])
#             # elif token[0] == tokenize.NEWLINE:
#             #     tokens.append('NEWLINE')

#             tokens.append(token[1])
#             if token[0] == tokenize.INDENT:
#                 tokens.append("<IND>")
#             elif token[0] == tokenize.DEDENT:
#                 tokens.append("<DED>")
#             # else:
#             #     tokens.append(token[1])

#             prev_line = token[3][0]
#             prev_col_end = token[3][1]

#     # suppress raise from buggy code
#     # Note: Exception is only raised at EOF
#     except Exception as e:
#         print(traceback.format_exc())

#     return tokens


# # Sample input 1: Simple function
# sample_code_1 = """
# def hello():
#     print("Hello, World!")
#     return 42
# print('Hello Peter')
# """
# result_1 = str_to_token_list(sample_code_1, 2, 6)
# print(result_1)
# print("PARSED")
# src_str = "".join(result_1)
# print(src_str)

# # Sample input 3: Comments and indentation
# sample_code_3 = """
# # This is a comment
# if True:
#     # Indented comment
#     x = 10
#     y = 20
# else:
#     z = 30
# """
# result_3 = str_to_token_list(sample_code_3, 1, 8)
# # print("".join(result_3))

# # def pretty_string(s: str, lang: Optional[str] = None) -> str: ##! RESOLVE this error
# #     newwords: list = []
# #     newsent: bool = True
# # print('DONE'): bool = True\n

# ef pretty_string(s: str, lang: Optional[str] = None) -> str: ##! RESOLVE this error
#     newwords: list = []
#     newsent: bool = True
#     print('DONE')


# EX: 1
# def add_numbers(a: str, b: str):
#     return a + b

# result = add_numbers(5, 10)
# print(result)


"""
Issues:

1. Misleading Documentation: The incorrect type hints make it appear that the function works with strings, but it actually works with integers. Developers might try to pass strings in the future, leading to confusing behavior (concatenation instead of arithmetic). 

2. Future Errors: Suppose someone adds input validation based on the type hints. They might wrongly validate inputs to ensure they’re strings, leading to:

```
if not isinstance(a, str) or not isinstance(b, str):
    raise TypeError("Arguments must be strings!")
```
    
This would cause errors later in the program even though the function actually works perfectly fine with integers.

3. Tool Confusion: Linters, IDEs, or type-checking tools that rely on type annotations would not detect any issues, falsely assuming the code is handling strings correctly.

4. Hard to Debug: Since Python doesn’t enforce type annotations, the code will run without raising any type-related errors. However, future debugging will be painful because the function does not behave as documented by its annotations, leading to hard-to-track bugs when unexpected inputs are passed.

Wrong annotation -> Misleading Documentation -> Future Error while Integration -> Hard to Debug

"""


EX: 2


# def process_user_data(usernames: str):
#     """
#     Processes a list of usernames by converting each username to uppercase and printing it.

#     Args:
#         usernames (str): A string containing one or more usernames, separated by whitespace.

#     Returns:
#         None
#     """

#     for username in usernames:
#         print(username.upper())


# process_user_data("Alice")


EX: 3


# Process input but dont know about output
def process_inputs(inputs):
    result = {}
    for item in inputs:
        if isinstance(item, str):
            result[item] = "Processed"
        elif isinstance(item, int):
            result[item] = item + 1
    return result


# incorrect type
from typing import Dict, List


def process_inputs(inputs: List[str]) -> Dict[str, str]:
    result = {}
    for item in inputs:
        if isinstance(item, str):
            result[item] = "Processed"
        elif isinstance(item, int):
            result[item] = item + 1  # Increment integer
    return result


print(process_inputs(["Hello", "World"]))


# correct type

from typing import Dict, List, Union


def process_inputs(
    inputs: List[Union[str, int]]
) -> Dict[Union[str, int], Union[str, int]]:
    result = {}
    for item in inputs:
        if isinstance(item, str):
            result[item] = "Processed"
        elif isinstance(item, int):
            result[item] = item + 1
    return result


print(process_inputs(["Hello", "World"]))


########### EXP 4 ##############
from typing import Dict, List, Union


##! WITHOUT TYPE HINTS
def process_api_data(data):
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = [value]  # Normalize string to list
        elif isinstance(value, list):
            result[key] = value  # Keep list as is
    return result


##! INCORRECT TYPE
def process_api_data_v2(data: Dict[str, str]) -> Dict[str, List[str]]:
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = [value]
        elif isinstance(value, list):
            result[key] = value
    return result


##? CORRECT TYPE
def process_api_data_v3(data: Dict[str, str | List[str]]) -> Dict[str, List[str]]:
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = [value]
        elif isinstance(value, list):
            result[key] = value
    return result


"""
What’s Wrong?
1. Incorrect Input Type: The input is annotated as Dict[str, str], meaning that all values in the dictionary should be strings. But in reality, we know that the values can be either strings or lists of strings!

2. Return Type Mismatch: The return type is annotated as Dict[str, List[str]], but the logic doesn’t ensure that all values will be lists of strings. The code could fail if the API returns unexpected data types like integers or None.
"""


def calculate_taxes(incomes: list[float | str | int], tax_rate: int) -> list[float]:
    return [float(income) * tax_rate for income in incomes]


incomes = [50000.0, 60000.0, "75000.0"]
tax_rate = 0.2
taxes = calculate_taxes(incomes, tax_rate)
print("tAX: ", taxes)


# Option 1: Fix the data to ensure all values are float
# def calculate_taxes(incomes: list[float], tax_rate: float) -> list[float]:
#     return [income * tax_rate for income in incomes]


# # After correction, the string "75000.0" is converted to a float
# incomes = [50000.0, 60000.0, 75000.0]
# tax_rate = 0.2
# taxes = calculate_taxes(incomes, tax_rate)  # Now it works correctly.


# # Option 2: Update the type hint to handle possible string-float mismatches from parsing
# def calculate_taxes(incomes: list[Union[float, str]], tax_rate: float) -> list[float]:
#     return [float(income) * tax_rate for income in incomes]


# # PyTypeWizard allows for string numbers and converts them automatically
# incomes = [50000.0, 60000.0, "75000.0"]  # Strings are handled and converted to float
# tax_rate = 0.2
# taxes = calculate_taxes(
#     incomes, tax_rate
# )
# print("NEW TAX: ", taxes)
