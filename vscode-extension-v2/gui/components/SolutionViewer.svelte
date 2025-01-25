<script>
    import markdownit from 'markdown-it';
    
    export let solution = '';
    export let solutionLoading = false;
    export let explainTerminology = '';
    export let solutionObject;
    
    const md = markdownit({
        html: true,
        linkify: true,
        typographer: true
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
        console.log('Saving solution');
        tsvscode.postMessage({ type: 'saveEntry', value: solutionObject }, '*');
    }
</script>

<style>
    /* Copy the solution-related styles from original Sidebar.svelte */
    :root {
        --border-color: var(--vscode-editorGroup-border);
        --text-color: var(--vscode-editor-foreground);
        --error-background: var(--vscode-input-background);
        --error-hover-background: var(--vscode-button-secondaryBackground);
        --warning-color: var(--vscode-errorForeground);
        --button-color: var(--vscode-button-background);
        --button-hover-color: var(--vscode-button-hoverBackground);
    }

    pre {
        background-color: #222222;
        padding: 10px;
        border-radius: 5px;
        overflow: auto;
    }

    .section-header {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        margin-top: 10px;
        color: var(--text-color);
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

    .explanation {
        width: '80%';
        overflow: auto;
        background-color: #222222;
        padding: 5px;
        border-radius: 5px;
    }

    .explanation ul {
        margin-left: 20px;
        list-style: disc;
        margin-top: 10px;
    }

    .explanation li {
        margin-bottom: 10px;
        line-height: 1.5;
    }

    .explanation strong {
        font-weight: bold;
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

    .save-button {
        padding: 4px 8px;
        background: var(--button-color);
        border: none;
        border-radius: 4px;
        color: #222222;
        cursor: pointer;
        margin-top: 0.5rem;
    }

    .save-button:hover {
        background: var(--button-hover-color);
    }

    hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 20px 0;
    }

</style>

<div>
    <p class="section-header">Potential Solutions</p>
    {#if solutionLoading}
        <div class="loading-container">
            <p>Generating solution...</p>
        </div>
    {:else if solution}
        <div class="code-container">
            <pre>{filterCode(solution)}</pre>
            <button class="copy-button" on:click={(event) => copyCode(filterCode(solution), event.target)}>Copy</button>
        </div>
        <p class="section-header">Explanation</p>
        <div class="explanation">{@html filterExplanation(solution)}</div>
        <button class="save-button" on:click={() => onSaveSolution()}>Save Solution</button>
    {:else}
        <p class="empty-state">Click on an error to generate a solution</p>
    {/if}

    <hr />

    <div>
        <p class="section-header">Terminology Explanation</p>
        <div class="explanation">{@html explainTerminology}</div>
    </div>
</div>
