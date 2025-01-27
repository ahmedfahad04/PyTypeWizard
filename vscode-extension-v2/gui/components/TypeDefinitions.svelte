<script>
	// You can define any reactive variables or import statements here if needed
</script>

<main>
	<h1>Python Type Hints Overview</h1>
	<section>
		<h2>Introduction to Type Hints</h2>
		<p>
			Python's type hints, introduced in PEP 484, allow for optional type
			annotations that enhance code readability and facilitate static type
			checking. These annotations do not affect the runtime behavior of the code
			but serve as a guide for developers and tools.
		</p>
	</section>

	<section>
		<h2>Basic Types</h2>
		<p>The most fundamental types in Python include:</p>
		<ul>
			<li><code>int</code>: Represents integer values.</li>
			<li><code>float</code>: Represents floating-point numbers.</li>
			<li><code>str</code>: Represents string values.</li>
			<li>
				<code>bool</code>: Represents boolean values (<code>True</code> or
				<code>False</code>).
			</li>
		</ul>
		<div class="code-example">
			<pre>
def add(a: int, b: int) -> int:
	return a + b
        </pre>
		</div>
		<p>
			In this example, the function <code>add</code> expects two integers and returns
			an integer.
		</p>
	</section>

	<section>
		<h2>None Type</h2>
		<p>
			The <code>None</code> type is used to indicate that a function does not return
			a value:
		</p>
		<div class="code-example">
			<pre>
def greet(name: str) -> None:
	print("Hello, ", name)
        </pre>
		</div>
		<p>
			Here, the function <code>greet</code> returns <code>None</code>,
			indicating it doesn't return a value.
		</p>
	</section>

	<section>
		<h2>Any Type</h2>
		<p>
			The <code>Any</code> type is a special type that can match any type:
		</p>
		<div class="code-example">
			<pre>
from typing import Any

def process(data: Any) -> None:
	print(data)
        </pre>
		</div>
		<p>
			In this function, <code>data</code> can be of any type.
		</p>
	</section>

	<section>
		<h2>Union Type</h2>
		<p>
			The <code>Union</code> type allows a variable to be one of multiple types:
		</p>
		<div class="code-example">
			<pre>
  from typing import Union
  
  def get_length(value: Union[str, list]) -> int:
      return len(value)
        </pre>
		</div>
		<p>
			Here, <code>value</code> can be either a string or a list.
		</p>
	</section>

	<section>
		<h2>Optional Type</h2>
		<p>
			The <code>Optional</code> type is a shorthand for a <code>Union</code>
			with <code>None</code>:
		</p>
		<div class="code-example">
			<pre>
  from typing import Optional
  
  def find_item(key: int) -> Optional[str]:
      # Implementation here
      return None
        </pre>
		</div>
		<p>
			This function returns a string or <code>None</code> if the item is not found.
		</p>
	</section>

	<section>
		<h2>List and Tuple Types</h2>
		<p>To specify a list of a certain type or a tuple with specific types:</p>
		<div class="code-example">
			<pre>
  from typing import List, Tuple
  
  def process_list(numbers: List[int]) -> int:
      return sum(numbers)
  
  def get_coordinates() -> Tuple[float, float]:
      return (1.0, 2.0)
        </pre>
		</div>
		<p>
			The first function processes a list of integers, while the second returns
			a tuple of two floats.
		</p>
	</section>

	<section>
		<h2>Dictionary Type</h2>
		<p>To specify a dictionary with specific key-value types:</p>
		<div class="code-example">
			<pre>
  from typing import Dict
  
  def count_occurrences(items: Dict[str, int]) -> int:
      return sum(items.values())
        </pre>
		</div>
		<p>
			This function processes a dictionary with string keys and integer values.
		</p>
	</section>

	<section>
		<h2>Callable Type</h2>
		<p>
			The <code>Callable</code> type is used for functions or callable objects:
		</p>
		<div class="code-example">
			<pre>
from typing import Callable

def apply_function(func: Callable[[int, int], int], a: int, b: int) -> int:
	return func(a, b)
        </pre>
		</div>
		Here,<code>func</code> is a callable that takes two integers as arguments and
		returns an integer.
	</section>

	<section>
		<h2>Custom Types</h2>
		<p>
			You can create aliases for complex types using <code>NewType</code> or by assigning
			descriptive names to existing types:
		</p>
		<div class="code-example">
			<pre>
from typing import NewType

UserId = NewType('UserId', int)

def get_user_name(user_id: UserId) -> str:
# Implementation here
return "John Doe"
        </pre>
		</div>
		<p>
			This function uses a custom type alias <code>UserId</code>, which is based
			on <code>int</code>.
		</p>
	</section>

	<section>
		<h2>Generic Types</h2>
		<p>
			Python supports generic types to create reusable, type-safe data
			structures or functions:
		</p>
		<div class="code-example">
			<pre>
from typing import TypeVar, List

T = TypeVar('T')

def get_first_element(items: List[T]) -> T:
return items[0]
        </pre>
		</div>
		<p>
			The <code>get_first_element</code> function works with a list of any type,
			and the type is preserved.
		</p>
	</section>

	<section>
		<h2>Final Type</h2>
		<p>
			The <code>Final</code> type specifies that a variable should not be reassigned:
		</p>
		<div class="code-example">
			<pre>
from typing import Final

PI: Final = 3.14159

# PI cannot be reassigned to another value
        </pre>
		</div>
		<p>
			This ensures that <code>PI</code> remains constant throughout the program.
		</p>
	</section>

	<section>
		<h2>Literal Type</h2>
		<p>
			The <code>Literal</code> type restricts a variable to specific literal values:
		</p>
		<div class="code-example">
			<pre>
from typing import Literal

def process_status(status: Literal['active', 'inactive']) -> None:
print(f"Processing status: {status}")
        </pre>
		</div>
		<p>
			This function only accepts the literal values <code>'active'</code> or
			<code>'inactive'</code> for the <code>status</code> parameter.
		</p>
	</section>

	<section>
		<h2>Annotated Type</h2>
		<p>
			The <code>Annotated</code> type allows adding metadata or multiple type hints
			to a variable:
		</p>
		<div class="code-example">
			<pre>
from typing import Annotated

def process_value(value: Annotated[int, 'Positive Integer']) -> None:
print("Processing value: ", value)
        </pre>
		</div>
		<p>
			In this example, <code>value</code> is an integer annotated with the description
			'Positive Integer'.
		</p>
	</section>

	<section>
		<h2>Conclusion</h2>
		<p>
			Type hints in Python provide a way to add type information to your code
			without affecting its runtime behavior. By using type hints, you can
			improve code readability, catch errors early, and enhance the development
			experience.
		</p>
	</section>
</main>

<style>
	:root {
		--content-font: var(--vscode-editor-font-family);
	}

	:global(*) {
		font-size: var(--vscode-editor-font-size);
		font-family: var(--vscode-font-family);
	}

	main {
		line-height: 1.6;
		color: var(--vscode-editor-foreground);
		padding: 20px;
		background-color: var(--vscode-editor-background);
	}

	h1 {
		font-size: 2rem;
		color: var(--vscode-textLink-foreground);
		border-bottom: 2px solid var(--vscode-textLink-foreground);
		padding-bottom: 10px;
		margin-bottom: 20px;
	}

	h2 {
		font-size: 1.5rem;
		color: var(--vscode-textLink-activeForeground);
		margin-top: 5px;
		border-bottom: 1px solid var(--vscode-panel-border);
		padding-bottom: 5px;
	}

	p {
		color: var(--vscode-editor-foreground);
		margin: 10px 0;
	}

	ul {
		margin: 10px 0 20px 20px;
		padding: 0;
		list-style-type: disc;
	}

	ul li {
		margin: 5px 0;
		color: var(--vscode-editor-foreground);
	}

	.code-example {
		background-color: var(--vscode-editor-background);
		border: 1px solid var(--vscode-panel-border);
		padding: 16px;
		border-radius: 4px;
		margin: 15px 0;
		position: relative;
	}

	.code-example pre {
		margin: 0;
		/* padding: 16px; */
		font-family: var(--vscode-editor-font-family);
		font-size: var(--vscode-editor-font-size);
		line-height: 1.5;
		overflow-x: auto;
		white-space: pre;
	}

	.code-example code {
		color: var(--vscode-textPreformat-foreground);
	}

	section {
		margin-bottom: 24px;
		padding: 20px;
		background-color: var(--vscode-editor-inactiveSelectionBackground);
		border-radius: 4px;
		border: 1px solid var(--vscode-panel-border);
	}

	section:nth-child(odd) {
		background-color: var(--vscode-editor-selectionBackground);
	}
</style>
