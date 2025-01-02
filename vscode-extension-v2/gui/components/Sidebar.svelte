<script lang="ts">

    let errors = [
        {file: 'x.py', line: 10, message: 'Syntax error'}, 
        {file: 'y.py', line: 20, message: 'Syntax error'}
    ];
    
</script>

<style>
    .error {
        /* background-color: red; */
        border: 1px solid gray;
        color: white;
        padding: 10px;
        margin-top: 5px;
    }
</style>

<div>
    {#each errors as error}
        <div class="error">
            <h2>{error.file}</h2>
            <p>Line: {error.line}</p>
            <p>{error.message}</p>
        </div>
    {/each}
</div>