from math import ceil

from backend.ai.chunking.fixed_chunking import DEFAULT_CHUNK_SIZE, chunk_by_fixed_size
from backend.ai.chunking.heading_sections import split_into_sections

def chunk_by_layout(words, source_pdf, max_chunk_size=DEFAULT_CHUNK_SIZE):
    """Chunks a document along its headings; sections longer than max_chunk_size are split further by size."""
    chunks = []
    for section in split_into_sections(words):
        chunks.extend(chunk_section(section, source_pdf, max_chunk_size))
    return chunks

def chunk_section(section, source_pdf, max_chunk_size):
    part_count = ceil(len(section["words"]) / max_chunk_size)
    even_chunk_size = ceil(len(section["words"]) / part_count)
    parts = chunk_by_fixed_size(section["words"], source_pdf, even_chunk_size)

    for part_number, part in enumerate(parts, start=1):
        part["heading"] = section["heading"] if len(parts) == 1 else f"{section['heading']} ({part_number}/{len(parts)})"
    return parts
