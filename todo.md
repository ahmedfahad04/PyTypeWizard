# SPL TODOs

## Manually Handle Type Errors

- Unbound Names [10]: For that case we can implement auto import
- Undefined Imports
  > TO resolve this append search path with this value got from this command `python -c 'import site; print(site.getsitepackages()[0])'`

## Features

- Write Pre and Post Processing `script` which enables

  - Adding <IND> and <DED> where indentation and dedantation necessary
  - Extracting necessary source code

- Writing `script` to compare the fixed code and actual code to replace the correct types only.

- Collect at least 5 `Typed Repos` for testing. ✅

- Consider the `NOTE` on the Test Repo for LLM Help (specifically in Reasoning or other case)

## Error Handling

- If API response faild to send in backend the `webview` should not be shown.
- After installing pyre dependencies, extension should be `reloaded`.
