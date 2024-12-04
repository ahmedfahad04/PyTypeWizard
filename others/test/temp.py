from typing import Tuple


def get_student_info(name: str, age: int) -> Tuple[str, str]:
    return (name, age)

#! advantage 1: If we use types in python, we gets suggestion in functions like below:


def doUpperCase(text: str | list):
    print(text)  # get aggregated options for list and string (advantage 2)


#! cons 1: This type hints doesn't provide and type safety -> means it won't raise error if the type hint is wrong


import time 
print(time.asctime().split(' ')[-2])