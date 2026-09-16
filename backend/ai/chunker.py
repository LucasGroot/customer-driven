import os
import re

from pdf_reader import read_words

# keeps chunks under the embedding model's ~96-word (128-token) truncation limit, with margin
MAX_CHUNK_WORDS = 90

def is_bold(fontname):
    # font names vary across documents, but "bold" consistently appears in the font name regardless of the base font.
    return "bold" in fontname.lower()

def split_into_word_chunks(text, max_words=MAX_CHUNK_WORDS):
    """Split text into pieces of at most max_words, breaking at sentence
    boundaries so a piece isn't cut off mid-sentence where avoidable."""
    sentences = re.split(r"(?<=[.!?])\s+", text)

    sub_chunks = []
    current_words = []

    for sentence in sentences:
        words = sentence.split()
        if current_words and len(current_words) + len(words) > max_words:
            sub_chunks.append(" ".join(current_words))
            current_words = []
        if len(words) > max_words:
            # a single sentence alone exceeds the budget; hard-split it as a fallback
            for i in range(0, len(words), max_words):
                sub_chunks.append(" ".join(words[i:i + max_words]))
        else:
            current_words.extend(words)

    if current_words:
        sub_chunks.append(" ".join(current_words))

    return sub_chunks

def append_chunk(chunks, heading, words, source_pdf):
    if not words:
        return
    sub_texts = split_into_word_chunks(" ".join(words))
    if len(sub_texts) == 1:
        chunks.append({"heading": heading, "text": sub_texts[0], "source_pdf": source_pdf})
    else:
        for i, sub_text in enumerate(sub_texts, start=1):
            chunks.append({
                "heading": f"{heading} ({i}/{len(sub_texts)})",
                "text": sub_text,
                "source_pdf": source_pdf,
            })

def chunk_by_headings(pdf_path):
    words = read_words(pdf_path)
    source_pdf = os.path.basename(pdf_path)

    chunks = []
    current_heading = ""
    current_words = []
    building_heading = False

    for word in words:
        bold = is_bold(word["fontname"])

        if bold and not building_heading:
            # a bold word after non-bold text marks the start of a new section,
            # so the previous section is now complete and can be stored.
            append_chunk(chunks, current_heading, current_words, source_pdf)
            current_heading = word["text"]
            current_words = []
            building_heading = True
        elif bold and building_heading:
            current_heading += " " + word["text"]
        else:
            building_heading = False
            current_words.append(word["text"])

    # last section has no following heading, so the trigger never fires for it
    # it must be appended outside the loop.
    append_chunk(chunks, current_heading, current_words, source_pdf)

    return chunks


if __name__ == "__main__":
    chunks = chunk_by_headings("data/raw/kvaliteket/5290-1-Ferie.pdf")
    for c in chunks:
        print(f'### {c["heading"]}\n{c["text"][:100]}...\n')