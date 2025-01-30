<script>
	export let errors = [];
	export let loading = true;
	export let expandedErrors = [];

	const toggleExpansion = (index) => {
		expandedErrors[index] = !expandedErrors[index];
		expandedErrors = [...expandedErrors];
	};

	let showErrorList = true;
</script>

<div>
	{#if loading}
		<p class="loading">Loading errors...</p>
	{:else}
		<div>
			<div class="header-row">
				<p class="section-header">
					Detected Type Errors: <span class="error-count">{errors.length}</span>
				</p>
				<div>
					<button
						class="view-button"
						on:click={() => (showErrorList = !showErrorList)}
					>
						{#if showErrorList}
							<div style="display: flex; align-items: center; gap: 5px;">
								<!-- <svg
									version="1.1"
									id="Layer_1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
									x="0px"
									y="0px"
									width="20px"
									height="20px"
									viewBox="0 0 122.879 79.699"
									enable-background="new 0 0 122.879 79.699"
									xml:space="preserve"
									><g
										><path
											d="M0.955,37.326c2.922-3.528,5.981-6.739,9.151-9.625C24.441,14.654,41.462,7.684,59.01,7.334 c6.561-0.131,13.185,0.665,19.757,2.416l-5.904,5.904c-4.581-0.916-9.168-1.324-13.714-1.233 c-15.811,0.316-31.215,6.657-44.262,18.533l0,0c-2.324,2.115-4.562,4.39-6.702,6.82c4.071,4.721,8.6,8.801,13.452,12.227 c2.988,2.111,6.097,3.973,9.296,5.586l-5.262,5.262c-2.782-1.504-5.494-3.184-8.12-5.039c-6.143-4.338-11.813-9.629-16.78-15.85 C-0.338,40.563-0.228,38.59,0.955,37.326L0.955,37.326L0.955,37.326z M96.03,0l5.893,5.893L28.119,79.699l-5.894-5.895L96.03,0 L96.03,0z M97.72,17.609c4.423,2.527,8.767,5.528,12.994,9.014c3.877,3.196,7.635,6.773,11.24,10.735 c1.163,1.277,1.22,3.171,0.226,4.507c-4.131,5.834-8.876,10.816-14.069,14.963C95.119,67.199,79.338,72.305,63.352,72.377 c-6.114,0.027-9.798-3.141-15.825-4.576l3.545-3.543c4.065,0.705,8.167,1.049,12.252,1.031c14.421-0.064,28.653-4.668,40.366-14.02 c3.998-3.191,7.706-6.939,11.028-11.254c-2.787-2.905-5.627-5.543-8.508-7.918c-4.455-3.673-9.042-6.759-13.707-9.273L97.72,17.609 L97.72,17.609z M61.44,18.143c2.664,0,5.216,0.481,7.576,1.359l-5.689,5.689c-0.619-0.079-1.248-0.119-1.886-0.119 c-4.081,0-7.775,1.654-10.449,4.328c-2.674,2.674-4.328,6.369-4.328,10.45c0,0.639,0.04,1.268,0.119,1.885l-5.689,5.691 c-0.879-2.359-1.359-4.912-1.359-7.576c0-5.995,2.43-11.42,6.358-15.349C50.02,20.572,55.446,18.143,61.44,18.143L61.44,18.143z M82.113,33.216c0.67,2.09,1.032,4.32,1.032,6.634c0,5.994-2.43,11.42-6.357,15.348c-3.929,3.928-9.355,6.357-15.348,6.357 c-2.313,0-4.542-0.361-6.633-1.033l5.914-5.914c0.238,0.012,0.478,0.018,0.719,0.018c4.081,0,7.775-1.652,10.449-4.326 s4.328-6.369,4.328-10.449c0-0.241-0.006-0.48-0.018-0.72L82.113,33.216L82.113,33.216z"
										/></g
									></svg
								> -->
								<span>Hide Details</span>
							</div>
						{:else}
							<div style="display: flex; align-items: center; gap: 5px;">
								<!-- <svg
									version="1.1"
									id="Layer_1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
									x="0px"
									y="0px"
									width="20px"
									height="20px"
									viewBox="0 0 122.88 83.78"
									style="enable-background:new 0 0 122.88 83.78"
									xml:space="preserve"
									><g
										><path
											d="M95.73,10.81c10.53,7.09,19.6,17.37,26.48,29.86l0.67,1.22l-0.67,1.21c-6.88,12.49-15.96,22.77-26.48,29.86 C85.46,79.88,73.8,83.78,61.44,83.78c-12.36,0-24.02-3.9-34.28-10.81C16.62,65.87,7.55,55.59,0.67,43.1L0,41.89l0.67-1.22 c6.88-12.49,15.95-22.77,26.48-29.86C37.42,3.9,49.08,0,61.44,0C73.8,0,85.45,3.9,95.73,10.81L95.73,10.81z M60.79,22.17l4.08,0.39 c-1.45,2.18-2.31,4.82-2.31,7.67c0,7.48,5.86,13.54,13.1,13.54c2.32,0,4.5-0.62,6.39-1.72c0.03,0.47,0.05,0.94,0.05,1.42 c0,11.77-9.54,21.31-21.31,21.31c-11.77,0-21.31-9.54-21.31-21.31C39.48,31.71,49.02,22.17,60.79,22.17L60.79,22.17L60.79,22.17z M109,41.89c-5.5-9.66-12.61-17.6-20.79-23.11c-8.05-5.42-17.15-8.48-26.77-8.48c-9.61,0-18.71,3.06-26.76,8.48 c-8.18,5.51-15.29,13.45-20.8,23.11c5.5,9.66,12.62,17.6,20.8,23.1c8.05,5.42,17.15,8.48,26.76,8.48c9.62,0,18.71-3.06,26.77-8.48 C96.39,59.49,103.5,51.55,109,41.89L109,41.89z"
										/></g
									></svg
								> -->
								<span>View Details</span>
							</div>
						{/if}
					</button>
				</div>
			</div>
			<div class="error-list">
				{#if showErrorList}
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
									{error.file_name.split('/').pop()} - Line {error.line_num},
									Col {error.col_num}</span
								>
							</div>
							{#if expandedErrors[index]}
								<div class="error-details">
									<p><strong>File:</strong> {error.display_name}</p>
									<p style="margin-top: 5px;">
										<strong>Message:</strong>
										{error.message}
									</p>
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
				{/if}
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

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.view-button {
		background-color: var(--vscode-button-background);
		color: var(--vscode-button-foreground);
		border: 1px solid var(--vscode-button-background);
		padding: 2px 8px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.9em;
	}

	.view-button:hover {
		background-color: var(--vscode-button-hoverBackground);
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
