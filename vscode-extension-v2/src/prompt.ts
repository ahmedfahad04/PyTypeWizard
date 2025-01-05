import * as vscode from 'vscode';

export const BASE_PROMPT =
    "You are an expert Python tutor specializing in Type Hints. Your role is to provide clear, simple explanations, sample code, and guided steps to help users understand and apply Python Type Hints effectively. Whenever a type-related issue is asked, you should answer by inspecting the surrounding context and providing a logical solution tailored to the user's code. Respond only to questions related to Python Type Hints, including best practices, advanced usage, common pitfalls, and tools for static analysis. Politely decline to answer any questions outside the scope of Python Type Hints."


// define a chat handler
export const chatRequestHandler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
) => {
    // initialize the prompt
    let prompt = BASE_PROMPT;

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
