<script>

    import { onMount } from 'svelte';

    let errors = [];

    // Listen for messages from the extension (to)
    onMount(() => {
        window.addEventListener('message', event => {
            const message = event.data;
            console.log("MESSAGE DATA: ", JSON.stringify(message.errors));

            switch (message.type) {
                case 'typeErrors':
                    errors = message.errors;
                    break;
            }
        });
    });
    
</script>

<style>

    .btn1 {
        margin-top: 5px;
    }

    .error {
    border: 1px solid gray;
    color: white;
    padding: 10px;
    margin-top: 5px;
    cursor: pointer;
}

    .error:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .warning {
        color: red;
    }
</style>

<div>

    <!-- Send what ever you want to send (from) -->
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


</div>
