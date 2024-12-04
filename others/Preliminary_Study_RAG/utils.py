from git import Repo
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers.language.language_parser import (
    LanguageParser,
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.text_splitter import Language


def clone_repository(repo_url, repo_path):
    """
    Clones the repository from the given URL to the specified path.

    Args:
        repo_url: URL of the repository to clone.
        repo_path: Path where the repository should be cloned.
    """
    Repo.clone_from(repo_url, to_path=repo_path)


def load_documents(repo_path):
    """
    Loads and parses Python documents from the repository.

    Args:
        repo_path: Path to the repository containing Python files.

    Returns:
        documents: A list of loaded documents.
    """
    loader = GenericLoader.from_filesystem(
        repo_path,
        glob="**/*",
        suffixes=[".py"],
        parser=LanguageParser(language=Language.PYTHON, parser_threshold=500),
    )
    return loader.load()


def split_documents(documents):
    """
    Splits loaded documents into chunks.

    Args:
        documents: The documents to split.

    Returns:
        texts: A list of split document texts.
    """
    documents_splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON, chunk_size=500, chunk_overlap=20
    )
    return documents_splitter.split_documents(documents)
