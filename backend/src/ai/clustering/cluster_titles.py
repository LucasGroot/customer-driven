"""
Gives a cluster of questions a short title that says what the questions have in
common, so HR can read a cluster at a glance instead of reading its questions.
A cluster that was titled before keeps its saved title, see title_cache.
"""

import os

from src.ai.clustering.title_cache import cache_key, read_title_cache, save_title
from src.ai.llm.ask_llm import ask_llm

MAX_QUESTIONS_IN_PROMPT = 8
MAX_QUESTION_CHARACTERS = 300
MAX_TITLE_CHARACTERS = 80

# The dashboard is Norwegian, so the titles have to be as well
SYSTEM_PROMPT = (
    "Du gir korte titler til grupper av HR-henvendelser fra ledere og ansatte i Trondheim kommune. "
    "Tittelen skal si hva henvendelsene i gruppen har felles. Skriv på norsk bokmål, med høyst seks ord, "
    "uten punktum og uten å formulere tittelen som et spørsmål. "
    'Svar bare med JSON på formen {"title": "..."}.'
)


def build_title_prompt(question_texts, routine_name=None):
    """
    Lists the first questions of the cluster for the model. With a routine name the
    questions all belong to that routine, so the title has to tell them apart within it.
    """
    listed_questions = "\n".join(
        f"- {' '.join(text.split())[:MAX_QUESTION_CHARACTERS]}" for text in question_texts[:MAX_QUESTIONS_IN_PROMPT]
    )
    context = ""
    if routine_name is not None:
        context = f'Henvendelsene hører til rutinen "{routine_name}". Tittelen skal peke ut det spesielle temaet innenfor rutinen.\n\n'

    return f"{context}Henvendelser i gruppen:\n{listed_questions}"


def title_cluster(question_texts, routine_name=None):
    """
    Returns a title for the cluster. question_texts starts with the question that
    stands for the cluster, which is the one the model sees first. A cluster that was
    titled before, with the same prompt, gets its saved title instead of a new call.
    If the model gives no title, that question stands in for it, and the stand-in is
    not saved so the next run asks again.
    """
    prompt = build_title_prompt(question_texts, routine_name)
    key = cache_key(os.environ.get("LITELLM_MODEL", ""), SYSTEM_PROMPT, prompt)
    saved_title = read_title_cache().get(key)
    if saved_title is not None:
        return saved_title

    answer = ask_llm(SYSTEM_PROMPT, prompt)
    title = " ".join(str(answer.get("title", "")).split())[:MAX_TITLE_CHARACTERS]
    if not title:
        return " ".join(question_texts[0].split())[:MAX_TITLE_CHARACTERS]

    save_title(key, title)
    return title
