# from typing import List


# def add(a: int, b: str) -> List[int]:
#     return a + b

# add (7, 25)

# This is another line
'''
The word counter is going on
isn't it?
yes it is...... i think so
but does the number updates, yes you are right
/home/fahad/Documents/Projects/SPL3/workspace/.pyre_configuration
'''

# from typing import TypeVar

# # Define a generic type variable
# T = TypeVar('T')

# def add(a: T, b: T) -> T:
#     return a + b

# # Example usage
# result = add('7', '9')
# print(result)  # Output: 16
'''
Next Steps:
1. Parse the error message and create the input for model.
{
  "rule_id": "Incompatible parameter type [6]",
  "message": "In call `add_numbers`, for 3rd positional argument, expected `List[typing.Any]` but got `str`",
  "warning_line": "def add_numbers(a: int, b: int, c: list) -> int:",
  "source_code": "    result = add_numbers(5, '10', '25')\n"
}

'''
