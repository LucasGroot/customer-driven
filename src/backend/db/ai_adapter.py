import os
import re
from datetime import date, datetime
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

NEEDS_REVIEW_BELOW = 0.52      # = PARTIAL_COVERAGE_FROM dans priority.ts
MATCHES_PER_QUESTION = 3       # routines gardées par question

# À adapter : où arrivent l'export ServiceNow et les PDF (import géré ailleurs)
QUESTIONS_PATH = os.getenv("QUESTIONS_PATH", "../data/raw/questions.xlsx")
ROUTINES_PATH = os.getenv("ROUTINES_PATH", "../data/raw/kvaliteket")

_ID_RE = re.compile(r"\d+-\d+")


def _routine_id(filename):
    match = _ID_RE.match(filename)
    return match.group() if match else None


def _routine_title(filename):
    stem = Path(filename).stem
    title = re.sub(r"^\d+-\d+[\s_\-]*", "", stem).replace("_", " ").strip()
    return title or stem


def _routine_date(filename, fallback):
    # Les PDF n'ont pas de date de révision : on prend la date du fichier.
    try:
        path = Path(ROUTINES_PATH) / Path(filename).name
        return datetime.fromtimestamp(path.stat().st_mtime).date()
    except OSError:
        return fallback


def run_ai(progress):
    # Imports ici : torch/sentence-transformers sont lourds, et une erreur
    # d'import ne doit pas empêcher FastAPI de démarrer.
    import pandas as pd
    from src.ai.similarity_metrics.shared_logic import load_corpus
    from src.ai.similarity_metrics.cosine_similarity import cosine_similarity

    corpus = load_corpus(QUESTIONS_PATH, ROUTINES_PATH)   # lit questions + PDF
    progress(2)
    scores = cosine_similarity(corpus)                    # questions x routines
    progress(3)

    today = date.today()

    routines = {}      # routine_id -> tuple
    id_of = {}         # nom de fichier -> routine_id
    for filename in scores.columns:
        routine_id = _routine_id(Path(filename).name)
        if routine_id is None:
            continue
        id_of[filename] = routine_id
        routines[routine_id] = (routine_id, _routine_title(filename),
                                _routine_date(filename, today))

    questions, themes = [], []
    matches = {}       # (routine_id, question_id) -> similarité
    for question_id, row in scores.iterrows():
        best = row.dropna().nlargest(MATCHES_PER_QUESTION)
        top_score = float(best.iloc[0]) if len(best) else 0.0
        text = corpus.questions.at[question_id, "text"]
        questions.append((question_id, text, today, top_score < NEEDS_REVIEW_BELOW))

        for filename, score in best.items():
            if filename in id_of:
                key = (id_of[filename], question_id)
                matches[key] = max(matches.get(key, 0.0), min(1.0, max(0.0, float(score))))

        service = corpus.questions.at[question_id, "Tjenestetilbud"]
        if not pd.isna(service) and str(service).strip():
            themes.append((question_id, str(service).strip()))

    progress(4)
    return (
        list(routines.values()),
        questions,
        [(r, q, s) for (r, q), s in matches.items()],
        themes,
    )