def is_bold(fontname):
    return "bold" in fontname.lower()

def is_heading_word(word):
    return is_bold(word["fontname"]) and not word["in_table"]

def split_into_sections(words):
    """Groups a document's words into sections: a bold heading followed by its body words, tables included."""
    sections = []
    heading = ""
    body_words = []
    building_heading = False

    for word in words:
        if not is_heading_word(word):
            building_heading = False
            body_words.append(word)
        elif building_heading:
            heading += " " + word["text"]
        else:
            if body_words:
                sections.append({"heading": heading, "words": body_words})
            heading = word["text"]
            body_words = []
            building_heading = True

    if body_words:
        sections.append({"heading": heading, "words": body_words})

    return sections
