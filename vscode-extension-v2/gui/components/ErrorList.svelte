<script>
    export let errors = [];
    export let loading = true;
    export let expandedErrors = [];
    
    const toggleExpansion = (index) => {
        expandedErrors[index] = !expandedErrors[index];
        expandedErrors = [...expandedErrors];
    };
</script>

<style>

    .section-header {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        margin-top: 10px;
        color: var(--text-color);
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

    .error-container {
        margin-top: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        overflow: hidden;
        background-color: var(--error-background);
        color: var(--text-color);
    }

    .error-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        background-color: var(--error-hover-background);
        transition: background-color 0.3s;
    }

    .error-header:hover {
        background-color: var(--button-hover-color);
        color: var(--vscode-button-foreground);
    }

    .error-details {
        padding: 10px;
        background-color: var(--error-background);
        border-top: 1px solid var(--border-color);
    }

    .goto-button {
        display: inline-block;
        margin-top: 10px;
        padding: 5px 10px;
        background-color: var(--button-color);
        /* color: var(--vscode-button-foreground); */
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
    }

    .goto-button:hover {
        background-color: var(--button-hover-color);
        color: var(--vscode-button-foreground);
    }

    .error-count {
        font-weight: bold;
        color: var(--warning-color);
    }
</style>

<div>
    {#if loading}
        <p>Loading errors...</p>
    {:else}
        <div>
            <p class="section-header">Detected Type Errors: <span class="error-count">{errors.length}</span></p>
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
                        <span> {error.file_name.split('/').pop()} - Line {error.line_num}, Col {error.col_num}</span>
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
    {/if}
</div>