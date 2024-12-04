# example.py

def add_numbers(a:int, b:int, c:int):
    print(c)
    return a + b

def main():
    result = add_numbers(5, '10', "25")
    print(f"The result is {result}")

if __name__ == "__main__":
    main()
