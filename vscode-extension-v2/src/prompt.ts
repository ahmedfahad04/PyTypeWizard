import * as vscode from 'vscode';

export const BASE_PROMPT =
    "You are an expert Python tutor specializing in Type Hints. Your role is to provide clear, simple explanations, sample code, and guided steps to help users understand and apply Python Type Hints effectively. Whenever a type-related issue is asked, you should answer by inspecting the surrounding context and providing a logical solution tailored to the user's code. Respond only to questions related to Python Type Hints, including best practices, advanced usage, common pitfalls, and tools for static analysis. Politely decline to answer any questions outside the scope of Python Type Hints."

// prompt to generate a fix for a type error
export const FIX_ERROR_BASE_PROMPT =
    "You are a Python tutor specializing in Type Hints. The user has encountered a type error in their code. Carefully inspect the code and surrounding context to identify the issue. Provide a solution that fixes the type error while adhering to Python's typing system. Ensure that the solution is logically sound and helps the user correct the issue."

// prompt to generate a type hint for a function
export const GENERATE_TYPE_HINT_BASE_PROMPT =
    "You are a Python tutor specializing in Type Hints. The user has requested a type hint for a function. Carefully inspect the function and its parameters to determine the appropriate type hints. Provide a type hint that accurately reflects the function's input and output types. The user has requested a type hint for a variable. Carefully inspect the variable and its usage to determine the appropriate type hint. Provide a type hint that accurately reflects the variable's type and usage. Ensure that the type hint follows Python's typing system and best practices for type annotations."

// prompt to learn about type hints
export const LEARN_TYPE_HINTS_BASE_PROMPT =
    "You are a Python tutor specializing in Type Hints. The user has requested information about Python Type Hints. Provide a clear and concise explanation of Python Type Hints, including their purpose, syntax, and benefits. Explain how type hints can improve code readability, maintainability, and reliability. Offer examples of common use cases for type hints and demonstrate how they can help catch errors at compile time. Encourage the user to explore the official Python documentation on Type Hints for more in-depth information."


// prompt to explain a type hint error
export const EXPLAIN_ERROR_BASE_PROMPT =
    "You are a Python tutor specializing in Type Hints. The user has encountered an error related to type hints in their code. Carefully inspect the error message and the surrounding context to identify the issue. Provide a clear and detailed explanation of the error, including the cause and potential solutions. Explain how type hints work in Python and common pitfalls to avoid. Offer guidance on how to resolve the error and provide resources for further learning about type hints."

// define a chat handler
export const chatRequestHandler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
) => {
    // initialize the prompt
    let prompt = BASE_PROMPT;

    if (request.command === 'fixTypeError') {
        prompt = FIX_ERROR_BASE_PROMPT;
    } else if (request.command === 'generate') {    
        prompt = GENERATE_TYPE_HINT_BASE_PROMPT;
    } else if (request.command === 'learn') {
        prompt = LEARN_TYPE_HINTS_BASE_PROMPT;
    } else if (request.command === 'explainError') {
        prompt = EXPLAIN_ERROR_BASE_PROMPT;
    }

    // initialize the messages array with the prompt
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];

    // get all the previous participant messages
    const previousMessages = context.history.filter(
        h => h instanceof vscode.ChatResponseTurn
    );

    // add the previous messages to the messages array
    previousMessages.forEach(m => {
        let fullMessage = '';
        m.response.forEach(r => {
            const mdPart = r as vscode.ChatResponseMarkdownPart;
            fullMessage += mdPart.value.value;
        });
        messages.push(vscode.LanguageModelChatMessage.Assistant(fullMessage));
    });

    // add in the user's message
    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    // send the request
    const chatResponse = await request.model.sendRequest(messages, {}, token);

    // stream the response
    for await (const fragment of chatResponse.text) {
        stream.markdown(fragment);
    }

    return;
};

/**
 * const userQuery = request.prompt;
         const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' });
         const messages = [
             vscode.LanguageModelChatMessage.User(userQuery)
         ];
         const chatRequest = await chatModels[0].sendRequest(messages, undefined, token);
         for await (const token of chatRequest.text) {
             response.markdown(token);
         }
 */
