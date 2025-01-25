<script>
    export let history;
    export let testData;

    // Add search state
    let searchQuery = '';
    
    // Add filter function
    $: filteredHistory = history.filter(solution => {
        const searchTerm = searchQuery.toLowerCase();
        return solution.originalCode.toLowerCase().includes(searchTerm) || 
               solution.suggestedSolution.toLowerCase().includes(searchTerm) ||
               solution.errorMessage.toLowerCase().includes(searchTerm);
    });

    const filterCode = (content) => {
        const regex = /```python([\s\S]*?)```/;
        const match = regex.exec(content);
        return match ? match[1].trim() : null;
    };
</script>

<style>
    .solutions-container {
        padding: 1rem;
    }

    .solution-card {
        border: 1px solid var(--vscode-editor-foreground);
        border-radius: 4px;
        margin-bottom: 1rem;
        padding: 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;

        font-size: 1.3em;
        font-weight: 800;
        color: var(--vscode-editor-foreground);
    }

    .code-block {
        background: #222222;
        /* only apply left padding */
        padding: 0 0.5rem;
        margin: 0.5rem 0;
        
    }

    .topic-header {
        font-size: 1em;
        font-weight: bold;
        margin-bottom: 0.5rem;
        margin-top: 1.5rem;
        color: var(--vscode-disabledForeground);
    }

    /* Add search bar styles */
    .search-container {
        margin-bottom: 1rem;
    }
    
    .search-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--vscode-editor-foreground);
        border-radius: 4px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
    }

    hr {
        border: none;
        border-top: 1px solid var(--vscode-editor-foreground);
        margin: 10px 0;
    }

    pre {
        margin: 0;
        white-space: pre-wrap;
    }
</style>

<div class="solutions-container">
    <h2 style="margin-bottom: 10px; font-weight: bold;">Saved Solutions</h2>

    <!-- Add search bar -->
    <div class="search-container">
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
                <span class="timestamp">{new Date(solution.timestamp).toLocaleString()}</span>
            </div>
            
            <hr/>
            <div class="content">
                <h4 class="topic-header">Error Message:</h4>
                <p class="error-message">{solution.errorMessage.split(']:')[1]}</p>
                <h4 class="topic-header">Original Code:</h4>
                <div class="code-block">
                    <pre>{solution.originalCode}</pre>
                </div>
                <h4 class="topic-header">Solution:</h4>
                <div class="code-block">
                    <pre>{solution.suggestedSolution}</pre>
                </div>
            </div>
        </div>
    {/each}
</div>
