<script>
    import { onMount } from 'svelte';

    let errors = [];
    let loading = true;

    let expandedErrors = [];

    const toggleExpansion = (index) => {
        expandedErrors[index] = !expandedErrors[index];
        expandedErrors = [...expandedErrors]; // Ensure Svelte detects the change
    };

    onMount(() => {
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
                case 'typeErrors':
                    errors = message.errors;
                    // Initialize expanded state as false for all errors
                    expandedErrors = Array(errors.length).fill(false);
                    loading = false;
                    break;
            }
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
</style>

<div>
    {#if loading}
        <p>Loading errors...</p>
    {:else}
        <!-- Errors Section -->
        <div>
            <p class="section-header">
                Detected Type Errors: <span class="error-count">{errors.length}</span>
            </p>
            <div class="error-list">
                {#each errors as error, index}
                <div class="error-container">
                    <!-- Error Header -->
                    <div
                        class="error-header"
                        on:click={() => toggleExpansion(index)}
                        role="button"
                        aria-expanded={expandedErrors[index]}
                        tabindex="0"
                    >
                        <span>{error.rule_id}</span>
                        <span>Line {error.line_num}</span>
                    </div>

                    <!-- Expanded Details -->
                    {#if expandedErrors[index]}
                    <div class="error-details">
                        <p><strong>File:</strong> {error.file_name}</p>
                        <p><strong>Location:</strong> Line {error.line_num}, Column {error.col_num}</p>
                        <p class="warning"><strong>Message:</strong> {error.message}</p>
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

        <!-- Divider -->
        <hr />

        <!-- Potential Solutions Section -->
        <div>
            <p class="section-header">Potential Solutions</p>
            <!-- Placeholder for solutions -->
            <p>No solutions available yet. Stay tuned!</p>
        </div>
    {/if}
</div>
