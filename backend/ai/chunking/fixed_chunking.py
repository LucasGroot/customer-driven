DEFAULT_CHUNK_SIZE = 80 # Considering an embedding model's 128-token (~96-word) truncation limit

def chunk_by_fixed_size(words, source_pdf, max_chunk_size=DEFAULT_CHUNK_SIZE):
    """Splits a document's words into consecutive fixed-size chunks, regardless of headings or sentence boundaries."""
    word_texts = [w["text"] for w in words]

    chunks = []
    for start in range(0, len(word_texts), max_chunk_size):
        chunk_number = start // max_chunk_size + 1
        chunks.append({
            "heading": f"Chunk {chunk_number}",
            "text": " ".join(word_texts[start:start + max_chunk_size]),
            "source_pdf": source_pdf,
        })
    return chunks
