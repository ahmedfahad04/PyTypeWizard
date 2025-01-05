# Todo

## Feature Details

### VSCODE UI (branch -> feat/vscode-extension-2)

1. Add Settings option to ignore for checking error ✅
2. Add a beautiful custom sidebar view within 10th Dec ✅
3. Try to add any options to Extension (like which error type should be ignored) \*\* ✅
4. Search on how to solve undefined-import issues ✅
5. Fixed auto install pyre-check issue ✅
6. Show loading state while generating solutions & show the generated solutions. ✅
7. Add enable/disable option in vscode 'panel'.⌛
8. Add activity icon in the bottom panel like cody/copilot instead of sidebar.⌛
9. Added chat participant to fix, explain, learn and generate type hints for specific problem.

### Chat Interface (branch -> feat/chat-participant#3)

1. Implemented Basic Chat UI with Base Prompt. ✅
2. Follow this Tutorial [Chat Interface](https://code.visualstudio.com/api/extension-guides/chat) to add intuitive feature.

### RAG

1. Feed all the details of the detected errors to get better context. [pause]
2. Follow [this](https://docs.google.com/document/d/1KlKjsn5AFJs1EB_KFU0lZRfT7zvXr8WtVh7bwfAcHbE/edit?tab=t.0#heading=h.dbr1q3iyghne) algorithm to implement indexing, retrieving feature of RAG.

## Others

- Add command in Copilot Chat Interface (like specific command to explain, debug etc... think more!!) ✅
- Add Walkthrough window if time demands about how to use this application [lowest priority]
- Add project readability or cognitive complexity due to usage of type hints

### Solution Formatting

1. Provide necessary indentation of generated python code.
2. Integrate Typescript based LLM to get selected code.

### Issues

1. Whenever editor loads for the first time it takes a good amount of time to show the error list in sidebar.
   Then when I switch tab and get back to the pytypewizard tab it again start to load BUT it keeps on going. However if
   we press ctrl+s then it saves and the errors are visible. Need to fix it
