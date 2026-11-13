"""
Remembers the titles the language model gave to clusters, so a cluster that was
titled before is not sent to the model again. The titles are written to
data/processed, which is gitignored: they are made from ticket text, so the file
must never be committed.
"""

import hashlib
import json
import os
from pathlib import Path

TITLE_CACHE_PATH = Path(__file__).resolve().parents[4] / "data" / "processed" / "cluster_title_cache.json"


def cache_key(*identity_parts):
    """
    Identifies what the model was asked by a hash, so the file holds no question text.
    The parts are everything that decides the answer: the model, the instructions and
    the prompt. Changing any of them gives a new key, which is when an old title no
    longer fits.
    """
    identity = "\n".join(identity_parts)

    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def read_title_cache():
    """
    Returns the saved titles by key, or an empty dict if no run has saved any yet.
    """
    if not TITLE_CACHE_PATH.exists():
        return {}

    return json.loads(TITLE_CACHE_PATH.read_text(encoding="utf-8"))


def save_title(key, title):
    """
    Adds one title to the saved ones right away, so a run that stops halfway keeps
    what it got. The file is replaced in one step, so a stopped run never leaves a
    half-written one.
    """
    titles = read_title_cache() | {key: title}
    TITLE_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = TITLE_CACHE_PATH.with_suffix(".tmp")
    temporary_path.write_text(json.dumps(titles, ensure_ascii=False), encoding="utf-8")
    os.replace(temporary_path, TITLE_CACHE_PATH)
