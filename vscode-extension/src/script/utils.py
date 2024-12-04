# import io
# import tokenize


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


# def count_lines(code: str) -> int:
#     return len(code.strip().split("\n"))


# # Sample Python code to tokenize
# sample_code = """
# def add(a: float, b: float) -> float:
#     a = 1.5 * b
#     print(a)
#     if a > b:
#         print("A is BIGGER")
        
#     else:
#         print("B is BIGGER")
        
#     return a + b
# """

# # Test the str_to_token_list function
# line_idx = 2  # Starting line index
# line_count = count_lines(sample_code) + 1  # Number of lines in the sample code

# tokens = str_to_token_list(sample_code, line_idx, line_count)

# encoded = (
#     sample_code.replace("    ", "<IND>").replace("    ", "<DED>").lstrip("\n").rstrip()
# )

# print("Tokenized output:")
# print(encoded)

# code = "".join(tokens)

# print("==========================DECODED VERSION==========================")

# src_code = (
#     encoded.replace("<IND>", "    ").replace("<DED>", "    ").lstrip("\n").rstrip()
# )


# print("FINAL CODE: \n", src_code)

import autopep8

code = '''
def add(a: int, b: float) -> float: 
 a = 1.5 * b 
 print(i) 
 return a + b
'''

formatted_code = autopep8.fix_code(code)
print(formatted_code)