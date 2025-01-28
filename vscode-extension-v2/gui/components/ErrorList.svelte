<script>
	export let errors = [];
	export let loading = true;
	export let expandedErrors = [];

	const toggleExpansion = (index) => {
		expandedErrors[index] = !expandedErrors[index];
		expandedErrors = [...expandedErrors];
	};
</script>

<div>
	{#if loading}
		<p class="loading">Loading errors...</p>
	{:else}
		<div>
			<p class="section-header">
				Detected Type Errors: <span class="error-count">{errors.length}</span>
			</p>
			<div class="error-list">
				{#each errors as error, index}
					<div class="error-container">
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-interactive-supports-focus -->
						<div
							class="error-header"
							on:click={() => toggleExpansion(index)}
							role="button"
							aria-expanded={expandedErrors[index]}
						>
							<span>{error.rule_id}</span>
							<span>
								{error.file_name.split('/').pop()} - Line {error.line_num}, Col {error.col_num}</span
							>
						</div>
						{#if expandedErrors[index]}
							<div class="error-details">
								<p><strong>File:</strong> {error.display_name}</p>
								<p><strong>Message:</strong> {error.message}</p>
								<button
									class="goto-button"
									on:click={() => {
										tsvscode.postMessage({
											type: 'openFile',
											file: error.file_name,
											line: error.line_num,
											column: error.col_num,
										});
									}}
								>
									Go To →
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
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

	.section-header {
		font-size: 1.2em;
		font-weight: bold;
		margin-bottom: 10px;
		margin-top: 10px;
		color: var(--vscode-textLink-foreground);
	}

	.error-list {
		max-height: 400px;
		overflow-y: auto;
		padding-right: 5px;
	}

	.error-list::-webkit-scrollbar {
		width: 8px;
	}

	.error-list::-webkit-scrollbar-thumb {
		background-color: var(--vscode-scrollbarSlider-background);
		border-radius: 4px;
	}

	.error-list::-webkit-scrollbar-thumb:hover {
		background-color: var(--vscode-scrollbarSlider-hoverBackground);
	}

	.error-container {
		margin-top: 10px;
		border: 1px solid var(--vscode-panel-border);
		border-radius: 4px;
		overflow: hidden;
		background-color: var(--vscode-editor-background);
		color: var(--vscode-editor-foreground);
	}

	.error-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		cursor: pointer;
		background-color: var(--vscode-editor-lineHighlightBackground);
		transition: background-color 0.2s;
	}

	.error-header:hover {
		background-color: var(--vscode-list-hoverBackground);
		color: var(--vscode-list-hoverForeground);
	}

	.error-details {
		padding: 10px;
		background-color: var(--vscode-editor-background);
		border-top: 1px solid var(--vscode-panel-border);
	}

	.goto-button {
		display: inline-block;
		margin-top: 10px;
		padding: 5px 10px;
		background-color: var(--vscode-button-background);
		color: var(--vscode-button-foreground);
		border: none;
		border-radius: 4px;
		cursor: pointer;
		text-align: center;
	}

	.goto-button:hover {
		background-color: var(--vscode-button-hoverBackground);
	}

	.error-count {
		font-weight: bold;
		font-size: 1.2em;
		color: var(--vscode-problemsWarningIcon-foreground);
	}

	.loading {
		font-size: 1em;
		font-weight: bold;
		color: var(--vscode-editor-foreground);
		animation: pulse 1.5s infinite;
		margin-top: 10px;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}
</style>
