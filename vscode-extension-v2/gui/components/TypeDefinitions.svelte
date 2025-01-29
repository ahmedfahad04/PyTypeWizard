<script>
	// Add scroll to top functionality
	let showScrollButton = false;

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Show button when scrolled down
	function handleScroll() {
		showScrollButton = window.scrollY > 200;
	}
</script>

<svelte:window on:scroll={handleScroll} />

<main>
	<h1>Python Type Hints Overview</h1>

	<nav class="section-nav">
		<h3>Quick Navigation</h3>
		<ul>
			<li><a href="#introduction">Introduction to Type Hints</a></li>
			<li><a href="#basic-types">Basic Types</a></li>
			<li><a href="#none-type">None Type</a></li>
			<li><a href="#any-type">Any Type</a></li>
			<li><a href="#union-type">Union Type</a></li>
			<li><a href="#optional-type">Optional Type</a></li>
			<li><a href="#list-tuple">List and Tuple Types</a></li>
			<li><a href="#dictionary-type">Dictionary Type</a></li>
			<li><a href="#callable-type">Callable Type</a></li>
			<li><a href="#custom-types">Custom Types</a></li>
			<li><a href="#generic-types">Generic Types</a></li>
			<li><a href="#final-type">Final Type</a></li>
			<li><a href="#literal-type">Literal Type</a></li>
			<li><a href="#annotated-type">Annotated Type</a></li>
		</ul>
	</nav>

	<section id="introduction">
		<h2>Introduction to Type Hints</h2>
		<p>
			Python's type hints, introduced in PEP 484, allow for optional type
			annotations that enhance code readability and facilitate static type
			checking. These annotations do not affect the runtime behavior of the code
			but serve as a guide for developers and tools.
		</p>
	</section>

	<section id="basic-types">
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

	<section id="none-type">
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

	<section id="any-type">
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

	<section id="union-type">
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

	<section id="optional-type">
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

	<section id="list-tuple">
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

	<section id="dictionary-type">
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

	<section id="callable-type">
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

	<section id="custom-types">
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

	<section id="generic-types">
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

	<section id="final-type">
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

	<section id="literal-type">
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

	<section id="annotated-type">
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

	<section id="conclusion">
		<h2>Conclusion</h2>
		<p>
			Type hints in Python provide a way to add type information to your code
			without affecting its runtime behavior. By using type hints, you can
			improve code readability, catch errors early, and enhance the development
			experience.
		</p>
	</section>

	{#if showScrollButton}
		<button
			class="scroll-top-button"
			on:click={scrollToTop}
			title="Scroll to top"
		>
			<svg
				enable-background="new 0 0 32 32"
				height="32px"
				id="Layer_1"
				version="1.1"
				viewBox="0 0 32 32"
				width="32px"
				xml:space="preserve"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				><path
					d="M18.221,7.206l9.585,9.585c0.879,0.879,0.879,2.317,0,3.195l-0.8,0.801c-0.877,0.878-2.316,0.878-3.194,0  l-7.315-7.315l-7.315,7.315c-0.878,0.878-2.317,0.878-3.194,0l-0.8-0.801c-0.879-0.878-0.879-2.316,0-3.195l9.587-9.585  c0.471-0.472,1.103-0.682,1.723-0.647C17.115,6.524,17.748,6.734,18.221,7.206z"
					fill="#515151"
				/></svg
			>
		</button>
	{/if}
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

	.section-nav {
		background-color: var(--vscode-editor-inactiveSelectionBackground);
		padding: 15px 20px;
		border-radius: 6px;
		margin-bottom: 10px;
	}

	.section-nav ul {
		list-style: none;
		padding: 0;
		margin: 10px 0 0 0;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2px 5px;
	}

	.section-nav li {
		margin: 0;
		/* padding: 4px 0; */
	}

	.section-nav a {
		color: var(--vscode-textLink-foreground);
		text-decoration: none;
		font-size: 1.1rem;
		display: block;
	}

	.section-nav a:hover {
		text-decoration: underline;
		color: var(--vscode-textLink-activeForeground);
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

	.scroll-top-button {
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: var(--vscode-button-background);
		color: var(--vscode-button-foreground);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		opacity: 0.8;
		transition: opacity 0.2s;
		z-index: 1000;
	}

	.scroll-top-button:hover {
		opacity: 1;
		background-color: var(--vscode-button-hoverBackground);
	}
</style>
