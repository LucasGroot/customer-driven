from pdf_reader import read_words

def is_bold(fontname):
    # font names vary across documents, but "bold" consistently appears in the font name regardless of the base font.
    return "bold" in fontname.lower()

def chunk_by_headings(pdf_path):
    words = read_words(pdf_path)

    chunks = []
    current_heading = ""
    current_words = []
    building_heading = False

    for word in words:
        bold = is_bold(word["fontname"])

        if bold and not building_heading:
            # a bold word after non-bold text marks the start of a new section,
            # so the previous section is now complete and can be stored.
            if current_words:
                chunks.append({"heading": current_heading, "text": " ".join(current_words)})
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
    if current_words:
        chunks.append({"heading": current_heading, "text": " ".join(current_words)})

    return chunks


if __name__ == "__main__":
    chunks = chunk_by_headings("data/raw/kvaliteket/5290-1-Ferie.pdf")
    for c in chunks:
        print(f'### {c["heading"]}\n{c["text"][:100]}...\n')