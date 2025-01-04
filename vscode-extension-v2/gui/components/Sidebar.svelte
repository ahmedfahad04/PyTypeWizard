<script>
    import { onMount } from 'svelte';

    let errors = [];
    let loading = true; 

    onMount(() => {
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'typeErrors':
                    errors = message.errors;
                    loading = false; 
                    break;
            }
        });
    });
</script>

<style>
    .error {
        border: 1px solid gray;
        color: white;
        padding: 10px;
        margin-top: 5px;
        cursor: pointer;
        background-color: var(--vscode-input-background);
    }

    .error:hover {
        background-color: var(--vscode-button-secondaryBackground);
    }

    .warning {
        color: red;
    }

    .loader {
        border: 3px solid var(--vscode-input-background);
        border-radius: 50%;
        border-top: 3px solid var(--vscode-button-background);
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>

<div>
    {#if loading}
        <div class="loader"></div>
    {:else}
        <!-- Send what ever you want to send (from) -->
        <p>Detected Type Errors: {errors.length}</p>
        {#each errors as error}
        <button class="error" 
            on:click={() => {
                tsvscode.postMessage({
                    type: 'openFile',
                    file: error.file_name,
                    line: error.line_num,
                    column: error.col_num
                });
            }}
            on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    tsvscode.postMessage({
                        type: 'openFile',
                        file: error.file_name,
                        line: error.line_num,
                        column: error.col_num
                    });
                }
            }}>
            <h2>{error.rule_id}</h2>
            <h3 style="color:greenyellow">Line: {error.display_name}</h3>
            <h4 style="color:gainsboro">Line: {error.line_num}</h4>
            <p class="warning">{error.message}</p>
        </button>
        {/each}
    {/if}

</div>
