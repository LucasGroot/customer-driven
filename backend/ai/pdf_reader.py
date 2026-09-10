import pdfplumber

def read_words(pdf_path):
    """Reads a PDF and returns all words, as well as their font info."""
    words = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words.extend(page.extract_words(extra_attrs=["fontname"]))
    return words