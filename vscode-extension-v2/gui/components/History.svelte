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
</script>

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
						🗑️
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
    }

    .delete-button:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
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
        background: var(--vscode-editor-background);
        padding: 0 0.5rem;
        overflow-x: auto;
        white-space: nowrap;
        max-width: 100%;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
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
</style>

