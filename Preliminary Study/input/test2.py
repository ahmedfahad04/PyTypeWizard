from typing import Dict, List, Optional, Tuple


def add_numbers(a: int, b: int, c: str) -> int:
    return a + b + c

def greet(name: List[str]) -> str: return "Hello, " + name

def process_items(items: List[int]) -> List[str]:
    processed_items = []
    for item in items:
        processed_items.append(item * 2)  #  Type error: item * 2 is an int, not str
    return processed_items

def find_user(users: Dict[int, str], user_id: int) -> str: 
    return users.get(user_id, None) #! [Solved] Type Errorclear

def calculate_total(prices: List[float]) -> float:
    total = 0
    for price in prices:
        total += price
    return total

def get_student_info(name: str, age: int) -> Tuple[str, str]:  #! [Solved] Type error: should be Tuple[str, int]
    return (name, age)

def main():
    # result = add_numbers(5, '10', '25')  # Type error: second argument should be int
    # print(result)

    # message = greet(123)  
    # print(message)

    # items = [1, 2, 3, 4]
    # processed = process_items(items)
    # print(processed)

    # users = {1: "Alice", 2: "Bob"}
    # user_name = find_user(users, 12)
    # print(user_name)

    # prices = [19.99, 5.49, 3.50]
    # total = calculate_total(prices)
    # print(f"Total: {total}")

    student_info = get_student_info("John Doe", 20)
    print(f"Student Name: {student_info[0]}, Age: {student_info[1]}")

if __name__ == "__main__":
    main()

'''
This code contains several type-related errors:

In process_items, it attempts to append an int to a List[str].
In find_user, it returns None where a str is expected.
In get_student_info, it returns a Tuple[str, int] but is annotated to return Tuple[str, str].
In the main function, it calls add_numbers with an int and a str, which is incorrect.
In the main function, it calls greet with an int, which is incorrect.
You can run Pyre on this code to see it detect these type errors. To do this, follow these steps:
'''