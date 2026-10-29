from backend.ai.similarity_metrics.shared_logic import load_corpus, top_k_per_routine

from sentence_transformers import SentenceTransformer
import json
import os
import litellm
import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ["API_KEY"]
api_url = os.environ["API_URL"]

# Possible models:
# vertex_ai/gemini-3.8-flash
# vertex_ai/gemini-3.8-live
# vertex_ai/gemini-4-argon
# vertex_ai/gemini-3.7-flash
# vertex_ai/gemini-3.1-pro-preview

DECISION_MODEL = "vertex_ai/gemini-3.8-flash"
EMBEDDING_MODEL_NAME = "NbAiLab/borealis-embed-212m"

N_ROUTINES = 3  # routines shown to the LLM per question
DRY_RUN = False  # True: only print prompts, don't call the LLM

SYSTEM_PROMPT = """You help HR find knowledge gaps in a quality management system.
You get a manager question and candidate routines, each with its most
relevant excerpts. Decide which routines actually answer the question.
Respond ONLY with JSON:
{"verdict": "covered" | "partial" | "not_covered",
 "relevant_routines": ["R1", ...],   // empty list if no routine is relevant
 "reason": "one or two sentences"}"""


def select_candidates(i, chunk_scores, routine_scores, offsets, n_routines, chunks_per_routine):
    """
    For question i, returns the n_routines best routines (best first) as a list of
    (routine_idx, chunk_idxs), where chunk_idxs are the routine's best chunks
    (indices into corpus.chunk_texts, best first). Routines with no chunks (NaN) are skipped.
    """
    row = routine_scores[i]
    valid = np.flatnonzero(~np.isnan(row))
    top = valid[np.argsort(-row[valid])[:n_routines]]

    candidates = []
    for r in top:
        start, end = offsets[r], offsets[r + 1]
        best = start + np.argsort(-chunk_scores[i, start:end])[:chunks_per_routine]
        candidates.append((int(r), best))
    return candidates


def build_prompt(question, candidates, corpus):
    """Returns the prompt and a map from label (R1, R2, ...) to routine index."""
    label_to_routine = {}
    parts = [f"QUESTION:\n{question}\n\nCANDIDATE ROUTINES:"]
    for rank, (routine_idx, chunk_idxs) in enumerate(candidates, start=1):
        label = f"R{rank}"
        label_to_routine[label] = routine_idx
        parts.append(f"\n=== {label}: {corpus.routine_names[routine_idx]} ===")
        for n, chunk_idx in enumerate(chunk_idxs, start=1):
            parts.append(f"[Excerpt {n}]\n{corpus.chunk_texts[chunk_idx]}")
    return "\n".join(parts), label_to_routine


def ask_llm(prompt):
    response = litellm.completion(
        model=f"litellm_proxy/{DECISION_MODEL}",
        api_base=api_url,
        api_key=api_key,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    text = response.choices[0].message.content.strip()
    # in case the model wraps the JSON in ```json fences anyway
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    return json.loads(text)


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         ground_truth_path="data/raw/ground_truth.csv",
         k=3,
         llm_chunk_input_amount=3):

    ground_truth_df = pd.read_csv(ground_truth_path, dtype=str)
    covered_questions = set(ground_truth_df["servicenow_id"].str.strip())

    corpus = load_corpus(questions_path=questions_path, routines_path=routines_path)
    questions_df = corpus.questions

    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    question_embeddings = model.encode(questions_df["text"].tolist(), normalize_embeddings=True)
    chunk_embeddings = model.encode(corpus.chunk_texts, normalize_embeddings=True)
    chunk_scores = question_embeddings @ chunk_embeddings.T

    routine_scores = top_k_per_routine(chunk_scores, corpus, k).to_numpy()

    offsets = np.concatenate([[0], np.cumsum(corpus.chunk_counts)])
    n_routines = min(N_ROUTINES, len(corpus.routine_names))

    results = []
    for i, (nummer, row) in enumerate(questions_df.iterrows()):
        if str(nummer).strip() in covered_questions:
            continue

        candidates = select_candidates(
            i, chunk_scores, routine_scores, offsets, n_routines, llm_chunk_input_amount
        )
        prompt, label_to_routine = build_prompt(row["text"], candidates, corpus)

        if DRY_RUN:
            print(prompt, "\n" + "-" * 80)
            continue

        try:
            answer = ask_llm(prompt)
        except Exception as e:
            answer = {"verdict": "error", "relevant_routines": [], "reason": str(e)}

        chosen = [label_to_routine[l] for l in answer.get("relevant_routines", [])
                  if l in label_to_routine]  # ignores labels the model invented
        results.append({
            "nummer": nummer,
            "question": row["text"],
            "verdict": answer.get("verdict"),
            "relevant_routines": "; ".join(corpus.routine_names[r] for r in chosen),
            "reason": answer.get("reason"),
            "best_routine_score": float(np.nanmax(routine_scores[i])),
        })

    results_df = pd.DataFrame(results)
    if not DRY_RUN:
        os.makedirs("data/processed", exist_ok=True)
        results_df.to_csv("data/processed/llm_verdicts.csv", index=False)
    return results_df


if __name__ == "__main__":
    main()