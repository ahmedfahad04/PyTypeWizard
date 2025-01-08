<script>
    import markdownit from 'markdown-it';
    import { onDestroy, onMount } from 'svelte';

    let errors = [];
    let loading = true;
    let solution = '';
    let expandedErrors = [];
    let solutionLoading = false;

    const md = markdownit()

    const toggleExpansion = (index) => {
        expandedErrors[index] = !expandedErrors[index];
        expandedErrors = [...expandedErrors];
    };

    const filterCode = (content) => {
        const regex = /```python([\s\S]*?)```/;
        const match = regex.exec(content);

        if (match) {
            return match[1].trim(); // Extract and trim the snippet
        }
        return null; // Return null if no match is found
    };


    const filterExplanation = (content) => {
        const codeBlockRegex = /```python[\s\S]*?```/g;
        // Remove all code blocks and trim the remaining text
        const explanation = content.replace(codeBlockRegex, '').trim();
        return md.render(explanation || null);
        // return explanation || null;
    };


    const handleMessage = (event) => {
        const message = event.data;

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
        margin-top: 10px;
        color: var(--text-color);
    }

    .error-count {
        font-weight: bold;
        color: var(--warning-color);
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

    pre {
        background-color: #222222;
        padding: 10px;
        border-radius: 5px;
        overflow: auto;
    }

    .explanation ul {
        margin-left: 20px;
        list-style: disc;
    }

    .explanation li {
        margin-bottom: 10px;
    }

    .explanation strong {
        font-weight: bold;
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
                <pre>{filterCode(solution)}</pre>
                <p class="section-header">Explanation</p>
                <div style="margin-top: 20px; background-color: --var(--vscode-editor-background); explanation">{@html filterExplanation(solution)}</div>
            {:else}
                <p class="empty-state">Click on an error to generate a solution</p>
            {/if}
        </div>
    {/if}
</div>
