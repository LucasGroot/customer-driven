"""
This file computes the similarity between all questions and routines and displays the questions with the
lowest sum of top-k cosine similarities and their most similar routines, with the idea of finding questions
that are not represented in the routines.
"""

import os
import pickle
import numpy as np
import html

from embedding_extract import (
    extract_all_chunk_embeddings,
    extract_all_question_embeddings,
)

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
KVALITEKET_PATH = "data/raw/kvaliteket"
QUESTIONS_PATH = "data/raw/questions"
QUESTION_FILE_NAME = "HR_HMS related questions in ServiceNow january - june 2026.xlsx"
QUESTIONS_SHEET = 0
QUESTIONS_COLUMN = "Beskrivelse"


def fetch_question_and_routine_embeddings():
    """
    Loads cached question and routine (chunk) embeddings from disk if available,
    otherwise generates them from scratch and caches them for next time.
    """

    # --- Questions ---
    try:
        with open("embeddings/question_embeddings.pkl", "rb") as file:
            question_embeddings = pickle.load(file)
    except FileNotFoundError:
        question_embeddings = extract_all_question_embeddings(
            xlsx_path=QUESTIONS_PATH,
            file_name=QUESTION_FILE_NAME,
            sheet=QUESTIONS_SHEET,
            column=QUESTIONS_COLUMN,
            model_name=MODEL_NAME,
        )

    # --- Routines (chunks) ---
    try:
        with open("embeddings/chunk_embeddings.pkl", "rb") as file:
            chunk_embeddings = pickle.load(file)
    except FileNotFoundError:
        chunk_embeddings = extract_all_chunk_embeddings(
            folder_path=KVALITEKET_PATH,
            model_name=MODEL_NAME,
        )

    return question_embeddings, chunk_embeddings


def compute_uncovered_questions(question_embeddings, chunk_embeddings, top_k=3):
    """
    For each question, find its top_k most similar routine chunks by cosine similarity
    (embeddings are already normalized, so this is just a dot product), sum those
    top_k scores, and return questions sorted ascending by that sum — i.e. the
    questions least represented in the routines first.
    """

    question_texts = [q["text"] for q in question_embeddings]
    question_vectors = np.array([q["embedding"] for q in question_embeddings])

    chunk_texts = [c["text"] for c in chunk_embeddings]
    chunk_vectors = np.array([c["embedding"] for c in chunk_embeddings])

    # (num_questions, num_chunks) similarity matrix
    similarity_matrix = question_vectors @ chunk_vectors.T

    results = []
    for i, row in enumerate(similarity_matrix):
        top_k_idx = np.argsort(row)[-top_k:][::-1]
        top_k_scores = row[top_k_idx]
        top_k_chunks = [chunk_texts[j] for j in top_k_idx]

        results.append({
            "question": question_texts[i],
            "score_sum": float(top_k_scores.sum()),
            "top_chunks": list(zip(top_k_chunks, top_k_scores.tolist())),
        })

    results.sort(key=lambda r: r["score_sum"])
    return results


def uncovered_to_html(results, top_k=3, out_path="visualizations/uncovered_questions.html"):
    rows_html = ""
    for r in results:
        chunks_html = "".join(
            f"<li><span class='score'>{score:.3f}</span> {html.escape(chunk_text[:200])}...</li>"
            for chunk_text, score in r["top_chunks"][:top_k]
        )
        rows_html += f"""
        <tr>
            <td class="question">{html.escape(r['question'] or '')}</td>
            <td class="score-sum">{r['score_sum']:.3f}</td>
            <td><ul>{chunks_html}</ul></td>
        </tr>
        """

    page = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Uncovered Questions Report</title>
        <style>
            body {{ font-family: sans-serif; margin: 2rem; background: #fafafa; }}
            table {{ border-collapse: collapse; width: 100%; background: white; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; vertical-align: top; }}
            th {{ background: #333; color: white; text-align: left; }}
            tr:nth-child(even) {{ background: #f5f5f5; }}
            .question {{ font-weight: 600; width: 30%; }}
            .score-sum {{ text-align: center; width: 8%; }}
            .score {{ color: #888; font-family: monospace; margin-right: 6px; }}
            ul {{ margin: 0; padding-left: 1.2rem; }}
        </style>
    </head>
    <body>
        <h1>Questions Least Covered by Routines</h1>
        <p>Sorted ascending by summed top-{top_k} cosine similarity to routine chunks.</p>
        <table>
            <tr><th>Question</th><th>Score sum</th><th>Top matching chunks</th></tr>
            {rows_html}
        </table>
    </body>
    </html>
    """

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)

    return out_path


if __name__ == "__main__":
    question_embeddings, chunk_embeddings = fetch_question_and_routine_embeddings()
    results = compute_uncovered_questions(question_embeddings, chunk_embeddings, top_k=3)

    uncovered_to_html(results, top_k=3, out_path="visualizations/uncovered_questions.html")
    #for r in uncovered[:20]:
    #    print(f"\nQuestion: {r['question']}")
    #    print(f"Score sum: {r['score_sum']:.3f}")
    #    for chunk_text, score in r["top_chunks"]:
    #        print(f"  - ({score:.3f}) {chunk_text[:100]}...")