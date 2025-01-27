<script>
	import markdownit from 'markdown-it';

	export let solution = '';
	export let solutionLoading = false;
	export let explainTerminology = '';
	export let solutionObject;
	export let document;
	export let diagnostic;

	const md = markdownit({
		html: true,
		linkify: true,
		typographer: true,
	});

	const filterCode = (content) => {
		const regex = /```python([\s\S]*?)```/;
		const match = regex.exec(content);
		return match ? match[1].trim() : null;
	};

	const filterExplanation = (content) => {
		const codeBlockRegex = /```python[\s\S]*?```/g;
		const explanation = content.replace(codeBlockRegex, '').trim();
		return md.render(explanation || null);
	};

	function copyCode(content, button) {
		navigator.clipboard.writeText(content);
		const originalText = 'Copy';
		button.textContent = 'Copied!';
		setTimeout(() => {
			button.textContent = originalText;
		}, 1500);
	}

	const onSaveSolution = () => {
		tsvscode.postMessage({ type: 'saveEntry', value: solutionObject }, '*');
	};

	const onReGenerateSolution = () => {
		tsvscode.postMessage(
			{
				type: 'reGenerateSolution',
				solutionObject: solutionObject,
				document: document,
				diagnostic: diagnostic,
			},
			'*'
		);
	};
</script>

<div>
	<p class="section-header">Potential Solutions</p>
	{#if solutionLoading}
		<div class="loading-container">
			<p>Generating solution...</p>
		</div>
	{:else if solution}
		<div class="code-container">
			<pre>{filterCode(solution)}</pre>
			<button
				class="copy-button"
				on:click={(event) => copyCode(filterCode(solution), event.target)}
				>Copy</button
			>
		</div>
		<p class="section-header">Explanation</p>
		<div class="explanation">{@html filterExplanation(solution)}</div>
		<div class="button-container">
			<div>
				<button class="save-button" on:click={() => onSaveSolution()}
					>Save Solution</button
				>
				<button
					class="regenerate-button"
					on:click={() => onReGenerateSolution()}>↺ Regenerate Response</button
				>
			</div>
			<div>
				<button
					class="apply-button"
					on:click={() =>
						tsvscode.postMessage(
							{
								type: 'applyFix',
								code: filterCode(solution),
								solutionObject: solutionObject,
							},
							'*'
						)}>Apply Fix</button
				>
			</div>
		</div>
	{:else}
		<p class="empty-state">Click on an error to generate a solution</p>
	{/if}

	<hr />

	<div>
		<p class="section-header">Terminology Explanation</p>
		{#if explainTerminology.length > 0}
			<div class="explanation">
				{@html filterExplanation(explainTerminology)}
				<pre>{filterCode(explainTerminology)}</pre>
			</div>
		{:else}
			<p class="empty-state">Select any Keyword to generate explanation</p>
		{/if}
	</div>
</div>

<style>
	:root {
		--border-color: var(--vscode-editorGroup-border);
		--text-color: var(--vscode-editor-foreground);
		--error-background: var(--vscode-input-background);
		--error-hover-background: var(--vscode-button-secondaryBackground);
		--warning-color: var(--vscode-errorForeground);
		--button-color: var(--vscode-button-background);
		--button-hover-color: var(--vscode-button-hoverBackground);
		--content-font: var(--vscode-editor-font-family);
	}

	:global(*) {
		font-size: var(--vscode-editor-font-size);
	}

	pre {
		background-color: #222222;
		padding: 10px;
		border-radius: 5px;
		overflow: auto;
		font-family: var(--vscode-editor-font-family);
		font-size: var(--vscode-editor-font-size);
	}

	.section-header {
		font-size: 1.2em;
		font-weight: bold;
		margin-bottom: 10px;
		margin-top: 10px;
		color: skyblue;
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.code-container {
		position: relative;
	}

	.copy-button {
		position: absolute;
		top: 5px;
		right: 5px;
		padding: 4px 8px;
		background: #333;
		border: none;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		width: 70px;
	}

	:global(.explanation ul) {
		margin-left: 5px;
		list-style: disc;
		margin-top: 10px;
	}

	:global(.explanation li) {
		margin-bottom: 10px;
		line-height: 1.5;
	}

	:global(.explanation strong) {
		font-weight: bold;
	}

	:global(.explanation pre) {
		background-color: #222222;
		padding: 10px;
		border-radius: 5px;
		overflow: auto;
	}

	.empty-state {
		text-align: center;
		font-style: italic;
		color: var(--vscode-disabledForeground);
	}

	/* save button style */

	.button-container {
		display: flex;
		gap: 10px;
		margin-top: 10px;
	}

	.button-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		margin-top: 10px;
		width: 100%;
	}

	.button-container > button {
		width: 100%;
	}

	/* For single button to take full width */
	.button-container > button:only-child {
		grid-column: 1 / -1;
	}

	.save-button {
		padding: 4px 8px;
		background: var(--button-color);
		border: none;
		border-radius: 4px;
		color: #222222;
		cursor: pointer;
	}

	.save-button:hover {
		background: var(--button-hover-color);
	}

	.regenerate-button {
		padding: 4px 8px;
		background: transparent;
		border: 1px solid var(--button-color);
		border-radius: 4px;
		color: var(--text-color);
		cursor: pointer;
		gap: 4px;
		margin-top: 0.5rem;
	}

	.regenerate-button:hover {
		background: var(--error-hover-background);
	}

	.apply-button {
		padding: 4px 8px;
		background: var(--button-color);
		border: none;
		border-radius: 4px;
		color: #222222;
		cursor: pointer;
	}

	.apply-button:hover {
		background: var(--button-hover-color);
	}

	hr {
		border: none;
		border-top: 1px solid var(--border-color);
		margin: 20px 0;
	}
</style>
