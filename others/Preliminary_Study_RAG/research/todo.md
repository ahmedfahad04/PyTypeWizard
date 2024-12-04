# Steps for preparing LLM for Code Analysis

1. Basic workflow implementation ✅
2. Understand the details of Document Splitting (Chunking). Its crucial for proper data retrieval. \*\* ✅
3. Understand the efficient way of Document Loading ✅
4. Understand the effective way to context retrieveing (term, hybrid search etc.)
5. Preparing proper prompt template
6. Adopt relevant Prompt Engineering Technique

## Insights

### `Chunking`

We can divide any documents based on specific delimeter or length. Popular Types are:

- Character Text Splitting _(Manually split data based on character: Worst)_ [CharacterTextSplitter]
- Recursive Character Splitting _(Provide \n, then \n used as splitter)_ [RecursiveCharacterTextSplitter]
- Document Based Splitting
  [MarkdownTextSplitter, **`PythonCodeTextSplitter`**]
- Semantics Chunking
  [SemanticChunker]
- Agentic Chunking

### A Bit Detailed about `Chunking`

**RecursiveCharacterTextSplitter:**
If we use a bit larger chunk_size, then for text document it can catch a complete sentence or
paragraph. Therefore, comperatively its better than `CharacterTextSplitter` but still not optimized.

**Semantic Chunking:**
We use embeddings to chunk

**Agentic Chunking:**
We use LLM for that case. Its also called proposition-based chunking. Interesting Concepts

> **We'll use `PythonCodeTextSplitter` for Chunking**

### `Document Loaders`

Some commonly used document loaders are:

- TextLoader
- CSVLoader
- DirectoryLoader
- Many more..

> **We'll use `GenericPerser` for Chunking**
