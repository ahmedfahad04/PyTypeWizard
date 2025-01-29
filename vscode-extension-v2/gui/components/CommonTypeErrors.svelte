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
	<h1>Common Python Type Errors & Fixes</h1>

	<!-- Add simple navigating list for faster navigation -->
	<nav class="section-nav">
		<h3>Quick Navigation</h3>
		<ul>
			<li><a href="#incompatible-variable">Incompatible Variable Type</a></li>
			<li><a href="#incompatible-return">Incompatible Return Type</a></li>
			<li><a href="#incompatible-parameter">Incompatible Parameter Type</a></li>
			<li><a href="#invalid-type">Invalid Type</a></li>
			<li><a href="#unbound-name">Unbound Name</a></li>
			<li><a href="#incompatible-attribute">Incompatible Attribute Type</a></li>
		</ul>
	</nav>

	<!-- 1 -->
	<section id="incompatible-variable">
		<h2>Incompatible Variable Type</h2>
		<p>
			An <strong>Incompatible Variable Type</strong> error occurs when a
			variable is assigned a value that does not match its declared type. This
			error is commonly caught by static type checkers like
			<strong>Pyre</strong>
			or <strong>mypy</strong> and helps ensure type safety in your code.
		</p>

		<h3>When Does It Occur?</h3>
		<p>This error typically occurs in the following scenarios:</p>
		<ul>
			<li>
				<strong>Direct Type Mismatch:</strong> A variable is declared with a specific
				type, but a value of a different type is assigned to it.
			</li>
			<li>
				<strong>Reassignment with Incompatible Type:</strong> A variable is reassigned
				a value of a different type than its original declaration.
			</li>
			<li>
				<strong>Incorrect Type Inference:</strong> A variable's type is inferred
				incorrectly, leading to a mismatch when used later in the code.
			</li>
		</ul>

		<h3>Example of Incorrect Usage</h3>
		<p>
			Here’s an example where a variable is declared as an integer but is
			assigned a string:
		</p>
		<div class="code-example">
			<pre>
    # Incorrect Code
    x: int = "Hello, World!"  # Error: Incompatible variable type
            </pre>
		</div>
		<p>
			In this case, the static type checker will raise an error because the type
			of <code>"Hello, World!"</code> (a string) does not match the declared
			type of <code>x</code> (an integer).
		</p>

		<h3>How to Fix It</h3>
		<p>
			To resolve this error, ensure that the assigned value matches the declared
			type. Here’s the corrected version of the above example:
		</p>
		<div class="code-example">
			<pre>
    # Corrected Code
    x: int = 42  # No error: Type matches declaration
            </pre>
		</div>
		<p>
			If the variable needs to accept multiple types, use a <code>Union</code> type:
		</p>
		<div class="code-example">
			<pre>
    from typing import Union
    
    x: Union[int, str] = "Hello, World!"  # No error: Type is compatible
            </pre>
		</div>
	</section>

	<!-- 2 -->
	<section id="incompatible-return">
		<h2>Incompatible Return Type</h2>
		<p>
			An <strong>Incompatible Return Type</strong> error occurs when a function
			returns a value that does not match its declared return type. This error
			is commonly caught by static type checkers like <strong>Pyre</strong> or
			<strong>mypy</strong> and ensures that functions adhere to their type contracts.
		</p>

		<h3>When Does It Occur?</h3>
		<p>This error typically occurs in the following scenarios:</p>
		<ul>
			<li>
				<strong>Direct Return Type Mismatch:</strong> A function is declared to return
				a specific type, but it returns a value of a different type.
			</li>
			<li>
				<strong>Conditional Return with Mismatched Types:</strong> A function has
				multiple return paths, and at least one of them returns a value of an incompatible
				type.
			</li>
			<li>
				<strong>Implicit Return of <code>None</code>:</strong> A function is
				declared to return a non-<code>None</code> type, but it implicitly
				returns <code>None</code> (e.g., missing a return statement).
			</li>
		</ul>

		<h3>Example of Incorrect Usage</h3>
		<p>
			Here’s an example where a function is declared to return an integer but
			returns a string:
		</p>
		<div class="code-example">
			<pre>
    # Incorrect Code
    def get_value() -> int:
        return "Hello, World!"  # Error: Incompatible return type
            </pre>
		</div>
		<p>
			In this case, the static type checker will raise an error because the
			return type of <code>"Hello, World!"</code> (a string) does not match the
			declared return type of <code>int</code>.
		</p>

		<h3>How to Fix It</h3>
		<p>
			To resolve this error, ensure that the function returns a value that
			matches its declared return type. Here’s the corrected version of the
			above example:
		</p>
		<div class="code-example">
			<pre>
    # Corrected Code
    def get_value() -> int:
        return 42  # No error: Return type matches declaration
            </pre>
		</div>
		<p>
			If the function needs to return multiple types, use a <code>Union</code> type:
		</p>
		<div class="code-example">
			<pre>
    from typing import Union
    
    def get_value() -> Union[int, str]:
        return "Hello, World!"  # No error: Return type is compatible
            </pre>
		</div>
		<p>
			If the function can return <code>None</code>, use <code>Optional</code>:
		</p>
		<div class="code-example">
			<pre>
    from typing import Optional
    
    def find_item(key: int) -> Optional[str]:
        if key == 42:
            return "Found"
        return None  # No error: Return type is compatible
            </pre>
		</div>
	</section>

	<!-- 3 -->
	<section id="incompatible-parameter">
		<h2>Incompatible Parameter Type</h2>
		<p>
			An <strong>Incompatible Parameter Type</strong> error occurs when the type
			of an argument passed to a function doesn't match the expected parameter type
			in the function's signature. This is one of the most common type errors caught
			by Pyre.
		</p>

		<h3>When Does It Occur?</h3>
		<p>This error typically occurs in the following scenarios:</p>
		<ul>
			<li>
				<strong>Optional vs Required Types:</strong> Passing an Optional type where
				a non-Optional type is expected
			</li>
			<li>
				<strong>Container Type Mismatches:</strong> Issues with container types related
				to covariance/contravariance
			</li>
			<li>
				<strong>Type Hierarchy Violations:</strong> Passing a type that isn't compatible
				with the parameter's type hierarchy
			</li>
		</ul>

		<h3>Example of Incorrect Usage</h3>
		<div class="code-example">
			<pre>
    from typing import Optional

    def takes_int(x: int) -> None:
        pass

    def f(x: Optional[int]) -> None:
        takes_int(x)  # Error: Incompatible parameter type
        </pre>
		</div>

		<h3>How to Fix It</h3>
		<p>
			To fix this error, ensure the argument type matches the parameter type:
		</p>
		<div class="code-example">
			<pre>
    from typing import Optional

    def takes_int(x: int) -> None:
        pass

    def f(x: Optional[int]) -> None:
        if x is not None:
            takes_int(x)  # Correct: x is guaranteed to be int here
        </pre>
		</div>

		<h3>Understanding Covariance and Contravariance</h3>
		<p>
			When working with generic types, it's important to understand two key
			concepts:
		</p>
		<ul>
			<li>
				<strong>Covariance (List[Cat] → List[Animal]):</strong> Allows using a more
				specific type where a more general type is expected
			</li>
			<li>
				<strong>Contravariance (Consumer[Animal] → Consumer[Cat]):</strong> Allows
				using a more general type where a more specific type is expected
			</li>
		</ul>
		<div class="code-example">
			<pre>
    from typing import List, TypeVar

    class Animal: pass
    class Cat(Animal): pass

    # Covariant example
    cats: List[Cat] = [Cat()]
    animals: List[Animal] = cats  # OK: List is covariant

    # Contravariant example (using callable)
    def feed_animal(animal: Animal) -> None: pass
    def feed_cat(cat: Cat) -> None: pass

    animal_feeder: Callable[[Animal], None] = feed_cat  # OK
        </pre>
		</div>
	</section>

	<!-- 4 -->
	<section id="invalid-type">
		<h2>Invalid Type</h2>
		<p>
			An <strong>Invalid Type</strong> error occurs when Pyre encounters a type annotation
			that it cannot understand or interpret correctly. This commonly happens when
			using incorrect type syntax or attempting to use types in ways that aren't
			supported by Python's type system.
		</p>

		<h3>When Does It Occur?</h3>
		<p>This error typically occurs in the following scenarios:</p>
		<ul>
			<li>
				<strong>Incorrect Type Syntax:</strong> Using square brackets instead of
				proper generic type annotations
			</li>
			<li>
				<strong>Constructor as Type:</strong> Using a constructor call instead of
				a class name in type annotations
			</li>
			<li>
				<strong>Missing Type Imports:</strong> Using type annotations without importing
				necessary types from the typing module
			</li>
		</ul>

		<h3>Example of Incorrect Usage</h3>
		<p>Here are some common examples that trigger Invalid Type errors:</p>
		<div class="code-example">
			<pre>
    # Incorrect Code
    x: [str] = ["hello"]  # Error: Invalid type annotation
    
    class MyClass:
        pass
    
    obj: MyClass() = MyClass()  # Error: Constructor used as type
        </pre>
		</div>

		<h3>How to Fix It</h3>
		<p>To resolve Invalid Type errors, use proper type annotation syntax:</p>
		<div class="code-example">
			<pre>
    # Corrected Code
    from typing import List
    
    x: List[str] = ["hello"]  # Correct: Using proper generic type
    
    class MyClass:
        pass
    
    obj: MyClass = MyClass()  # Correct: Using class name as type
        </pre>
		</div>
	</section>

	<!-- 5 -->
	<section id="unbound-name">
		<h2>Unbound Name</h2>
		<p>
			An <strong>Unbound Name</strong> error occurs when your code attempts to access
			a variable that Pyre cannot determine is defined in the current scope. This
			error helps catch potential runtime NameErrors before they occur.
		</p>

		<h3>When Does It Occur?</h3>
		<p>This error typically occurs in the following scenarios:</p>
		<ul>
			<li>
				<strong>Undefined Variables:</strong> Accessing variables that haven't been
				defined in the current scope
			</li>
			<li>
				<strong>Implicit Global Variables:</strong> Using global variables without
				explicit top-level declarations
			</li>
			<li>
				<strong>Missing Imports:</strong> Using names that should be imported but
				aren't
			</li>
		</ul>

		<h3>Example of Incorrect Usage</h3>
		<div class="code-example">
			<pre>
    # Incorrect Code
    def set_x() -> None:
        global x
        x = 42

    def use_x() -> None:
        print(x)  # Error: Unbound name

    set_x()
    use_x()
        </pre>
		</div>

		<h3>How to Fix It</h3>
		<p>
			To fix this error, explicitly declare variables at the appropriate scope:
		</p>
		<div class="code-example">
			<pre>
    from typing import Optional

    # Correct: Explicit declaration of global variable
    x: Optional[int] = None

    def set_x() -> None:
        global x
        x = 42

    def use_x() -> None:
        print(x)  # No error: x is properly declared

    set_x()
    use_x()
        </pre>
		</div>

		<h3>Best Practices</h3>
		<ul>
			<li>
				Always declare global variables at module level with proper type
				annotations
			</li>
			<li>
				Use type hints for all variables that will be accessed across different
				scopes
			</li>
			<li>
				Consider using class attributes instead of global variables when
				possible
			</li>
		</ul>
	</section>

	<!-- 6 -->
	<section id="incompatible-attribute">
		<h2>Incompatible Attribute Type</h2>
		<p>
			An <strong>Incompatible Attribute Type</strong> error occurs when you attempt
			to assign a value to a class attribute that doesn't match its declared type.
			This is a common type safety check that helps maintain class invariants.
		</p>

		<h3>When Does It Occur?</h3>
		<p>This error typically occurs in the following scenarios:</p>
		<ul>
			<li>
				<strong>Direct Type Mismatch:</strong> Assigning a value of wrong type to
				a typed attribute
			</li>
			<li>
				<strong>Container Type Issues:</strong> Assigning container types with incompatible
				type parameters
			</li>
			<li>
				<strong>Inheritance Violations:</strong> Overriding attributes with incompatible
				types in subclasses
			</li>
		</ul>

		<h3>Example of Incorrect Usage</h3>
		<div class="code-example">
			<pre>
    class Foo:
        x: int = 0

    def f(foo: Foo) -> None:
        foo.x = "abc"  # Error: Incompatible attribute type
        </pre>
		</div>

		<h3>How to Fix It</h3>
		<p>
			To fix this error, ensure the assigned value matches the attribute's
			declared type:
		</p>
		<div class="code-example">
			<pre>
    class Foo:
        x: int = 0

    def f(foo: Foo) -> None:
        foo.x = 42  # Correct: Type matches declaration

    # If multiple types are needed:
    from typing import Union

    class FlexibleFoo:
        x: Union[int, str] = 0

    def f(foo: FlexibleFoo) -> None:
        foo.x = "abc"  # Now works with Union type
        </pre>
		</div>

		<h3>Best Practices</h3>
		<ul>
			<li>Always declare attribute types explicitly in class definitions</li>
			<li>Use Union types when an attribute needs to handle multiple types</li>
			<li>Consider using property decorators for complex type conversions</li>
		</ul>
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
		color: var(--vscode-textLink-foreground);
		margin-top: 15px;
		border-bottom: 1px solid var(--vscode-panel-border);
		padding-bottom: 8px;
	}

	h3 {
		font-size: 1.2rem;
		color: var(--vscode-textLink-foreground);
		margin-top: 10px;
		border-bottom: 1px solid var(--vscode-panel-border);
		padding-bottom: 5px;
	}

	.section-nav {
		background-color: var(--vscode-editor-inactiveSelectionBackground);
		padding: 15px 20px;
		border-radius: 6px;
		margin-bottom: 30px;
	}

	.section-nav ul {
		list-style: none;
		padding: 0;
		margin: 10px 0 0 0;
	}

	.section-nav li {
		margin: 8px 0;
	}

	.section-nav a {
		color: var(--vscode-textLink-foreground);
		text-decoration: none;
		font-size: 1.1rem;
	}

	.section-nav a:hover {
		text-decoration: underline;
		color: var(--vscode-textLink-activeForeground);
	}

	section {
		padding: 20px;
		margin: 15px 0;
	}

	section:nth-child(even) {
		background-color: var(--vscode-editor-lineHighlightBackground);
		border-radius: 6px;
	}

	section:nth-child(odd) {
		background-color: var(--vscode-editor-background);
		border: 1px solid var(--vscode-panel-border);
		border-radius: 6px;
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
