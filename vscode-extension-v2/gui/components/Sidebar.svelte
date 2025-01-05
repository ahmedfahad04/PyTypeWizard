<script>
    import { onDestroy, onMount } from 'svelte';
    

    let errors = [];
    let loading = true;
    let solution = '';
    let expandedErrors = [];
    let solutionLoading = false;

    const toggleExpansion = (index) => {
        expandedErrors[index] = !expandedErrors[index];
        expandedErrors = [...expandedErrors]; // Trigger reactivity
    };

    const handleMessage = (event) => {
        const message = event.data;
        console.log(">> MESSAGE", {message});

        switch (message.type) {
            case 'typeErrors':
                console.log('Received type errors:', message);
                errors = message.errors;
                expandedErrors = Array(errors.length).fill(false);
                loading = false;
                break;

            case 'solutionLoading':
                console.log('Solution loading:', message);
                solutionLoading = message.loading;
                break;

            case 'solutionGenerated':
                console.log('Solution generated:', message);
                solution = message.solution;
                solutionLoading = false;
                break;

            default:
                console.warn('Unhandled message type:', message.type);
                break;
        }
    };

    onMount(() => {
        window.addEventListener('message', handleMessage);
        console.log('Event listener added');

        // Cleanup when component is destroyed
        onDestroy(() => {
            window.removeEventListener('message', handleMessage);
            console.log('Event listener removed');
        });
    });
</script>


<style>
    :root {
        --border-color: var(--vscode-editorGroup-border);
        --text-color: var(--vscode-editor-foreground);
        --error-background: var(--vscode-input-background);
        --error-hover-background: var(--vscode-button-secondaryBackground);
        --warning-color: var(--vscode-errorForeground);
        --button-color: var(--vscode-button-background);
        --button-hover-color: var(--vscode-button-hoverBackground);
    }

    .error-details {
        padding: 10px;
        background-color: var(--error-background);
        border-top: 1px solid var(--border-color);
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
        background-color: var(--button-hover-color);
    }

    hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 20px 0;
    }

    .section-header {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        color: var(--text-color);
    }

    .error-count {
        font-weight: bold;
        color: var(--warning-color);
    }

     /* Add Markdown-specific styling */
     .markdown-content {
        font-family: 'Fira Code', monospace;
        font-size: 14px;
        line-height: 1.5;
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
        padding: 15px;
        border-radius: 6px;
        border: 1px solid var(--vscode-editorGroup-border);
        overflow-x: auto;
    }

    .error-container {
        margin: 10px 0;
        padding: 10px;
        background: var(--vscode-editorHoverWidget-background);
        border-radius: 4px;
        border: 1px solid var(--vscode-editorGroup-border);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .error-header {
        font-weight: bold;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
    }

    .error-header:hover {
        background-color: var(--vscode-editor-selectionBackground);
    }

    .goto-button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        padding: 5px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .goto-button:hover {
        background: var(--vscode-button-hoverBackground);
    }

    pre {
        background: var(--vscode-editor-background);
        padding: 10px;
        border-radius: 6px;
        overflow-x: auto;
    }

    code {
        background: var(--vscode-editor-hoverHighlight-background);
        padding: 2px 4px;
        border-radius: 4px;
    }

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .empty-state {
        text-align: center;
        font-style: italic;
        color: var(--vscode-disabledForeground);
    }
</style>

<div>
    {#if loading}
        <p>Loading errors...</p>
    {:else}
        <div>
            <p class="section-header">Detected Type Errors: {errors.length}</p>
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
                        <span>Line {error.line_num}, Col {error.col_num}</span>
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
                                    column: error.col_num
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

        <hr />

        <div>
            <p class="section-header">Potential Solutions</p>
            {#if solutionLoading}
                <div class="loading-container">
                    <p>Generating solution...</p>
                </div>
            {:else if solution}
                <div class="markdown-content" innerHTML={solution}></div>
            {:else}
                <p class="empty-state">Click on an error to generate a solution</p>
            {/if}
        </div>
    {/if}
</div>
