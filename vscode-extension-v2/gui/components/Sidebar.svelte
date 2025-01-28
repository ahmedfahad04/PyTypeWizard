<script>
    import { onDestroy, onMount } from 'svelte';
    //! must mention the other component here
    import ErrorList from './ErrorList.svelte';
    import SolutionViewer from './SolutionViewer.svelte';
	import History from './History.svelte';
    import TypeDefinitions from './TypeDefinitions.svelte';
    
    let currentPage = 'main'; // Add this to track current page
    let errors = [];
    let loading = true;
    let solution = '';
    let expandedErrors = [];
    let solutionLoading = false;
    let explainTerminology = '';
    let history = [];
    let solutionObject;
    let document;
    let diagnostic;

    const handleMessage = (event) => {
        const message = event.data;
        switch (message.type) {
            case 'typeErrors':
                errors = message.errors;
                expandedErrors = Array(errors.length).fill(false);
                loading = false;
                break;
            case 'solutionLoading':
                solutionLoading = message.loading;
                break;
            case 'solutionGenerated':
                solution = message.solution;
                solutionObject = message.solutionObject;
                document = message.document;
                diagnostic = message.diagnostic;
                solutionLoading = false;
                break;
            case 'explainTerminology':
                explainTerminology = message.explanation;
                break;
            case 'history':
                console.log('Inside History: ', message.history);
                history = message.history;
                switchPage(message.currentPage)
                break;
        }
    };

    const switchPage = (page) => {
        currentPage = page;
    };

    // tabs
    const tabs = [
        { id: 'main', icon: '🏠', text: 'Home' }, 
        { id: 'typeIntro', icon: '📚', text: 'About Type Hints' }

    ];

    onMount(() => {
        window.addEventListener('message', handleMessage);
        onDestroy(() => {
            window.removeEventListener('message', handleMessage);
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
        --content-font: var(--vscode-editor-font-family);
	}

	:global(*) {
		font-size: var(--vscode-editor-font-size);
	}

    hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 20px 0;
    }

    .tab-list {
        display: flex;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    .tab-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        border: none;
        background: transparent;
        color: var(--vscode-foreground);
        border-bottom: 2px solid transparent;
        transition: background-color 0.2s;
    }

    .tab-item:hover {
        background: var(--vscode-list-hoverBackground);
    }

    .tab-item.active {
        border-bottom: 2px solid var(--vscode-focusBorder);
        background: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
    }

    .tab-icon {
        margin-right: 8px;
        font-size: 1.1em;
    }

    .tab-text {
        font-size: 13px;
    }

</style>

<div>
    <nav class="tab-container">
        <ul class="tab-list">
            {#each tabs as tab}
                <li>
                    <button 
                        class="tab-item"
                        class:active={currentPage === tab.id}
                        on:click={() => switchPage(tab.id)}
                    >
                        <span class="tab-icon">{tab.icon}</span>
                        <span class="tab-text">{tab.text}</span>
                    </button>
                </li>
            {/each}
        </ul>
    </nav>

    {#if currentPage === 'main'}
        <ErrorList {errors} {loading} {expandedErrors} />
        <hr />
        <SolutionViewer {solution} {solutionObject} {solutionLoading} {explainTerminology} />
    {:else if currentPage === 'history'}
        <History {history} />
    {:else if currentPage === 'typeIntro'}
        <TypeDefinitions />
    {/if}
</div>
