# Todo

## VSCODE UI (Part 1)

1. Add Settings option to ignore for checking error ✅
2. Add a beautiful custom sidebar view within 10th Dec ✅
3. Try to add any options to Extension (like which error type should be ignored) \*\* ✅
4. Search on how to solve undefined-import issues ✅
5. Fixed auto install pyre-check issue ✅
6. Show loading state while generating solutions & show the generated solutions. ✅
7. Add enable/disable option in vscode 'panel'.⌛
8. Add activity icon in the bottom panel like cody/copilot instead of sidebar.⌛
9. Show count of total detected error in the sidebar Icon ⌛
10. Show a Re-generate Solution button.

## VSCODE Packaging

1. Implement Default Packaging feature ✅ (run `vsce package` and update the version in package json)

### Extra

- Add command in Copilot Chat Interface (like specific command to explain, debug etc... think more!!) ✅
- Add Walkthrough window if time demands about how to use this application [lowest priority]
- Add project readability or cognitive complexity due to usage of type hints
- We should have the option to ignore some errors ✅
- Show the generated solution above the error-generated code snippet.

## RAG

1. Feed all the details of the detected errors to get better context.

## Solution Generation

1. Provide necessary indentation of generated python code.
2. Integrate Typescript based LLM to get selected code.

## Issues

1. Whenever editor loads for the first time it takes a good amount of time to show the error list in sidebar.
   Then when I switch tab and get back to the pytypewizard tab it again start to load BUT it keeps on going. However if
   we press ctrl+s then it saves and the errors are visible. Need to fix it.

2. Only activate if the current project is in python.
