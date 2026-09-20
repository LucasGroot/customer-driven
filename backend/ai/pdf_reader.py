import os

import pdfplumber

def read_words(pdf_path):
    """Reads a PDF and returns all words, as well as their font info."""
    words = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words.extend(page.extract_words(extra_attrs=["fontname"]))
    return words

def read_all_pdfs(folder_path):
    """Reads every PDF in folder_path, returning one {source_pdf, words} entry per file."""
    documents = []
    for filename in sorted(os.listdir(folder_path)):
        if not filename.endswith(".pdf"):
            continue
        words = read_words(os.path.join(folder_path, filename))
        documents.append({"source_pdf": filename, "words": words})
    return documents
