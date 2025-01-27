export const pyreTypeErrorsExplanation: string = `
**1. Incompatible Variable Type**

This error occurs when a variable is declared with a specific type annotation but is assigned a value of a different, incompatible type. For example:

\`\`\`python
i: int = "string"  # Error: Incompatible variable type
\`\`\`

In this case, \`i\` is annotated as an \`int\` but is assigned a \`str\` value. Pyre will report:

\`\`\`
Incompatible variable type [9]: i is declared to have type \`int\` but is used as type \`str\`.
\`\`\`

**Resolution:** Ensure that the variable is assigned a value matching its declared type. If the assignment is intentional, update the type annotation accordingly:

\`\`\`python
i: str = "string"  # Correct
\`\`\`

**2. Incompatible Parameter Type**

This error arises when a function is called with arguments that don't match the expected parameter types. For instance:

\`\`\`python
def add(x: int, y: int) -> int:
    return x + y

add(5, "6")  # Error: Incompatible parameter type
\`\`\`

Here, the \`add\` function expects both \`x\` and \`y\` to be integers, but it's called with \`5\` (an \`int\`) and \`"6"\` (a \`str\`). Pyre will report:

\`\`\`
Incompatible parameter type [6]: In call \`add\`, for 2nd positional argument, expected \`int\` but got \`str\`.
\`\`\`

**Resolution:** Ensure that all function arguments match the expected types. In this case, pass an integer instead of a string:

\`\`\`python
add(5, 6)  # Correct
\`\`\`

**3. Incompatible Return Type**

This error occurs when a function's return value doesn't match its declared return type. For example:

\`\`\`python
def greet(name: str) -> int:
    return f"Hello, {name}!"  # Error: Incompatible return type
\`\`\`

The \`greet\` function is annotated to return an \`int\`, but it returns a \`str\`. Pyre will report:

\`\`\`
Incompatible return type [7]: Expected \`int\` but got \`str\`.
\`\`\`

**Resolution:** Update the function's return type annotation to match the actual return value:

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"  # Correct
\`\`\`

**4. Invalid Type**

This error indicates the use of an expression that Pyre doesn't recognize as a valid type. For instance:

\`\`\`python
def process(data: MyCustomType) -> None:
    pass  # Error: Invalid type
\`\`\`

If \`MyCustomType\` is not defined or imported, Pyre will report:

\`\`\`
Invalid type [31]: Expression \`MyCustomType\` is not a valid type.
\`\`\`

**Resolution:** Ensure that all custom types are properly defined and imported:

\`\`\`python
class MyCustomType:
    pass

def process(data: MyCustomType) -> None:
    pass  # Correct
\`\`\`

**5. Unbound Name**

This error occurs when a variable is used before it is defined. For example:

\`\`\`python
def calculate() -> int:
    return x + 1  # Error: Unbound name
\`\`\`

If \`x\` is not defined in the current scope, Pyre will report:

\`\`\`
Unbound name [10]: Name \`x\` is used but not defined in the current scope.
\`\`\`

**Resolution:** Define the variable before using it:

\`\`\`python
def calculate() -> int:
    x = 5
    return x + 1  # Correct
\`\`\`

**6. Incompatible Attribute Type**

This error arises when an attribute is assigned a value of a type that doesn't match its declared type. For instance:

\`\`\`python
class Car:
    speed: int

car = Car()
car.speed = "fast"  # Error: Incompatible attribute type
\`\`\`

Here, \`speed\` is annotated as an \`int\`, but is assigned a \`str\`. Pyre will report:

\`\`\`
Incompatible attribute type [8]: Attribute \`speed\` declared in class \`Car\` has type \`int\` but is used as type \`str\`.
\`\`\`

**Resolution:** Assign a value to the attribute that matches its declared type:

\`\`\`python
car.speed = 100  # Correct
\`\`\`

**7. Unsupported Operand**

This error occurs when an operation is performed on operands of incompatible types. For example:

\`\`\`python
result = 5 + "10"  # Error: Unsupported operand
\`\`\`

Here, the \`+\` operator is used between an \`int\` and a \`str\`, which is not supported. Pyre will report:

\`\`\`
Unsupported operand [58]: \`+\` is not supported for operand types \`int\` and \`str\`.
\`\`\`

**Resolution:** Ensure that the operands are of compatible types for the operation:

\`\`\`python
result = 5 + int("10")  # Correct
\`\`\`

**8. Call Error**

This error indicates issues with function calls, such as incorrect arguments or calling non-callable objects. For instance:

\`\`\`python
def multiply(x: int, y: int) -> int:
    return x * y

multiply(5)  # Error: Call error
\`\`\`

Pyre will report:

\`\`\`
Too few arguments [19]: Call \`multiply\` expects 2 positional arguments, 1 was provided.
\`\`\`

**Resolution:** Provide the correct number and types of arguments when calling functions:

\`\`\`python
multiply(5, 10)  # Correct
\`\`\`
`;
