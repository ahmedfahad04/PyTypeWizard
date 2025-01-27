<script>
	import markdownit from 'markdown-it';

	export let history;

	// Add search state
	let searchQuery = '';

	const md = markdownit({
		html: true,
		linkify: true,
		typographer: true,
	});

	// Add filter function
	$: filteredHistory = history.filter((solution) => {
		const searchTerm = searchQuery.toLowerCase();
		return (
			solution.originalCode.toLowerCase().includes(searchTerm) ||
			solution.suggestedSolution.toLowerCase().includes(searchTerm) ||
			solution.errorMessage.toLowerCase().includes(searchTerm)
		);
	});

	const filterExplanation = (content) => {
		const codeBlockRegex = /```python[\s\S]*?```/g;
		const explanation = content.replace(codeBlockRegex, '').trim();
		return md.render(explanation || null);
	};

	const filterCode = (content) => {
		const regex = /```python([\s\S]*?)```/;
		const match = regex.exec(content);
		return match ? match[1].trim() : null;
	};

	const onDeleteSolution = (id) => {
		console.log('Deleting solution with id:', id);
		tsvscode.postMessage({ type: 'deleteEntry', id: id }, '*');
	};

	let showScrollButton = false;

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleScroll() {
		showScrollButton = window.scrollY > 200;
	}
</script>

<svelte:window on:scroll={handleScroll} />

<div class="solutions-container">
	<div
		style="display: flex; justify-content: space-between; align-items: center;"
	>
		<h2 style="margin-bottom: 10px; font-weight: bold;">
			Previous Fix History
		</h2>
		<h3 style="margin-bottom: 10px; font-weight: bold;">
			Total Entries: <span style="font-weight: bold; color: skyblue;"
				>{history.length}</span
			>
		</h3>
	</div>

	<!-- Add search bar -->
	<div class="search-container">
		<span style="margin-right: 10px; font-size: 16px;">Search:</span>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search in code and solutions..."
			class="search-input"
		/>
	</div>

	{#if filteredHistory.length === 0}
		<p>No solutions saved yet.</p>
	{/if}

	{#each filteredHistory as solution}
		<div class="solution-card">
			<div class="header">
				<span class="error-type">{solution.errorType}</span>
				<div style="display: flex; align-items: center;">
					<!-- <span>{new Date(solution.timestamp).toDateString()}</span> -->
					<button
						class="delete-button"
						on:click={() => onDeleteSolution(solution.id)}
						title="Delete solution"
					>
						<svg
							height="100%"
							style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"
							version="1.1"
							viewBox="0 0 128 128"
							width="100%"
							xml:space="preserve"
							xmlns="http://www.w3.org/2000/svg"
							xmlns:serif="http://www.serif.com/"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							><rect
								height="128"
								id="Trash"
								style="fill:none;"
								width="128"
								x="0.359"
								y="0.21"
							/><path
								d="M96.71,30.32c1.177,0.467 1.307,0.708 1.382,1.902c0,22.128 0.07,44.256 0,66.383c-0.077,8.095 -7.003,15.535 -15.617,15.617c-12.255,0.039 -24.511,0.039 -36.766,0c-8.141,-0.077 -15.536,-7.143 -15.617,-15.617l0,-66.383c0,0 0.927,-3.049 3.072,-1.688c0.565,0.358 0.885,1.004 0.928,1.688c0,22.145 -0.209,44.29 0.001,66.434c0.095,6.006 5.239,11.465 11.566,11.565c12.288,0.117 24.578,0.117 36.866,0c6.073,-0.096 11.547,-5.36 11.567,-11.72l0,-66.279c0.08,-1.271 1.244,-2.255 2.618,-1.902Zm-32.394,4.415c0.985,0.167 1.719,0.965 1.776,1.987l0,64c-0.104,1.852 -0.918,1.891 -1.776,1.988c-1.119,0.126 -2.16,-0.839 -2.224,-1.988l0,-64c0.064,-1.135 0.98,-2.057 2.224,-1.987Zm16,0c0.985,0.167 1.719,0.965 1.776,1.987l0,64c-0.091,1.622 -2.212,2.617 -3.414,1.415c-0.349,-0.349 -0.54,-0.587 -0.586,-1.415l0,-64c0.064,-1.135 0.98,-2.057 2.224,-1.987Zm-32,0c0.985,0.167 1.719,0.965 1.776,1.987l0,64c-0.092,1.638 -2.256,2.573 -3.414,1.415c-0.349,-0.349 -0.54,-0.587 -0.586,-1.415l0,-64c0.064,-1.135 0.98,-2.057 2.224,-1.987Zm57.276,-7.513l-82.5,0c-0.084,-0.005 -0.167,-0.01 -0.251,-0.015c-1.7,-0.325 -1.692,-1.009 -1.745,-1.859c-0.068,-1.079 0.867,-2.055 1.996,-2.126l23,0l0.001,-5.589c0.068,-1.785 1.587,-3.34 3.41,-3.41c9.7,-0.122 19.401,-0.001 29.102,-0.001c1.838,0.023 3.463,1.609 3.487,3.488l0,5.512l23.5,0c0,0 3.239,1.223 1.541,3.275c-0.372,0.45 -0.94,0.688 -1.541,0.725Zm-55.5,-4l28,0l0,-5l-28,0l0,5Z"
							/></svg
						>
					</button>
				</div>
			</div>

			<hr />
			<div class="content">
				<h4 class="topic-header">Error Message:</h4>
				<p class="error-message">{solution.errorMessage.split(']:')[1]}</p>
				<h4 class="topic-header">Original Code:</h4>
				<div class="code-container">
					<pre>{solution.originalCode}</pre>
				</div>
				<h4 class="topic-header">Solution:</h4>
				<div class="code-container">
					<pre>{filterCode(solution.suggestedSolution)}</pre>
					<!-- <button class="copy-button" on:click={(event) => copyCode(filterCode(solution.suggestedSolution), event.target)}>Copy</button> -->
				</div>
				<div class="explanation">
					{@html filterExplanation(solution.suggestedSolution)}
				</div>
			</div>
		</div>
	{/each}
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
</div>

<style>
	:root {
		--content-font: var(--vscode-editor-font-family);
	}

	:global(*) {
		font-size: var(--vscode-editor-font-size);
		font-family: var(--vscode-font-family);
	}

	.solutions-container {
		padding: 1rem;
	}

	.solution-card {
		border: 1px solid var(--vscode-panel-border);
		border-radius: 4px;
		margin-bottom: 1rem;
		padding: 1rem;
		background-color: var(--vscode-editor-background);
	}

	.delete-button {
		cursor: pointer;
		border-radius: 4px;
		border: 1px solid var(--vscode-button-border);
		background: var(--vscode-button-secondaryBackground);
		color: var(--vscode-button-secondaryForeground);
		margin-left: 0.5rem;
		margin-right: 0.5rem;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.delete-button:hover {
		background-color: var(--vscode-button-secondaryHoverBackground);
		color: var(--vscode-errorForeground);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 1.3em;
		font-weight: 800;
		color: var(--vscode-editor-foreground);
	}

	.code-block {
		background: var(--vscode-editor-background);
		padding: 0 0.5rem;
		margin: 0.5rem 0;
		border: 1px solid var(--vscode-panel-border);
	}

	.topic-header {
		font-size: 1em;
		font-weight: bold;
		margin-bottom: 0.5rem;
		margin-top: 1.5rem;
		color: var(--vscode-textLink-foreground);
	}

	.search-container {
		margin-top: 1rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--vscode-input-border);
		border-radius: 4px;
		background: var(--vscode-input-background);
		color: var(--vscode-input-foreground);
	}

	.search-input:focus {
		border-color: var(--vscode-focusBorder);
		outline: none;
	}

	.error-message {
		color: var(--vscode-errorForeground);
	}

	:global(.explanation ul) {
		margin-left: 20px;
		list-style: disc;
		margin-top: 10px;
		color: var(--vscode-editor-foreground);
	}

	:global(.explanation li) {
		margin-bottom: 10px;
		line-height: 1.5;
	}

	:global(.explanation strong) {
		font-weight: bold;
		color: var(--vscode-editor-foreground);
	}

	:global(.explanation pre) {
		background-color: var(--vscode-editor-background);
		padding: 10px;
		border-radius: 5px;
		overflow: auto;
		border: 1px solid var(--vscode-panel-border);
	}

	hr {
		border: none;
		border-top: 1px solid var(--vscode-panel-border);
		margin: 10px 0;
	}

	.code-container {
		position: relative;
		background: var(--vscode-editor-inactiveSelectionBackground);
		padding: 1rem;
		overflow-x: auto;
		white-space: nowrap;
		max-width: 100%;
		border: 1px solid var(--vscode-panel-border);
		border-radius: 4px;
		margin: 10px 0;
		box-shadow: 0 2px 4px var(--vscode-widget-shadow);
	}

	.code-container pre {
		margin: 0;
		font-family: var(--vscode-editor-font-family);
		color: var(--vscode-editor-foreground);
	}

	.copy-button {
		position: absolute;
		top: 5px;
		right: 5px;
		padding: 4px 8px;
		background: var(--vscode-button-secondaryBackground);
		border: none;
		border-radius: 4px;
		color: var(--vscode-button-secondaryForeground);
		cursor: pointer;
		width: 70px;
	}

	.copy-button:hover {
		background: var(--vscode-button-secondaryHoverBackground);
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
