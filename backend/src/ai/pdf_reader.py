import os

import pdfplumber

def read_words(pdf_path):
    """Reads a PDF and returns all words, as well as their font info and whether they sit inside a table."""
    words = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            table_boxes = [table.bbox for table in page.find_tables()]
            for word in page.extract_words(extra_attrs=["fontname"]):
                word["in_table"] = any(
                    left <= word["x0"] and word["x1"] <= right and top <= word["top"] and word["bottom"] <= bottom
                    for left, top, right, bottom in table_boxes
                )
                words.append(word)
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
