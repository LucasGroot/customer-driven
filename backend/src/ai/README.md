[Project README](../../../README.md) › [Backend](../../README.md) › ai

# ai

The language processing behind the analysis. [`snapshot/`](../snapshot/README.md) calls it; nothing here knows about the API or the database.

## The pipeline

1. [`pdf_reader.py`](pdf_reader.py) reads the words of a Kvaliteket PDF, with their fonts and whether they sit in a table.
2. [chunking](#chunking) groups them into sections under the bold headings.
3. [similarity_metrics](#similarity_metrics) embeds the chunks and the questions with `NbAiLab/borealis-embed-212m`, a multilingual model that handles Norwegian. A routine's score for a question is the mean of its three best chunk scores.
4. [`snapshot/build_snapshot.py`](../snapshot/build_snapshot.py) places each question on the routine that scores best, and flags the ones that score too low.
5. [clustering](#clustering) groups similar questions, and [llm](#llm) writes a short title for each group.

Do not swap the embedding model for an English-only one. Real ticket text must never be sent to an external service that the municipality has not approved, see [AI-FRAMEWORK.md](../../../docs/AI-FRAMEWORK.md). The scripts in [`backend/scripts/`](../../scripts/README.md) run these steps one at a time.

## chunking

Splits a routine into chunks that can be scored against a question.

| File | What it does |
|---|---|
| [`heading_sections.py`](chunking/heading_sections.py) | Finds the bold headings in the words from `pdf_reader` and groups the words into the sections under them |
| [`customized_chunking.py`](chunking/customized_chunking.py) | Chunks along the headings, and splits sections that are too long into evenly sized parts. This is what the analysis uses |
| [`fixed_chunking.py`](chunking/fixed_chunking.py) | Chunks into pieces of a fixed number of words. `customized_chunking` uses it to split sections that are too long, and it is the baseline to compare with |

The notebooks in [`backend/notebooks/`](../../notebooks/README.md) show how the two methods split a document.

## similarity_metrics

Scores questions against routines. Every method scores at chunk level: each chunk of a routine is scored against each question, and the routine's score is the mean of its `k` best chunk scores (`k` is 3).

| File | Method |
|---|---|
| [`cosine_similarity.py`](similarity_metrics/cosine_similarity.py) | Cosine similarity of sentence embeddings. **The method the analysis uses** |
| [`euclidean_similarity.py`](similarity_metrics/euclidean_similarity.py) | Negated Euclidean distance between embeddings |
| [`tfidf_similarity.py`](similarity_metrics/tfidf_similarity.py) | tf-idf cosine similarity |
| [`bm25_similarity.py`](similarity_metrics/bm25_similarity.py) | BM25 |
| [`shared_logic.py`](similarity_metrics/shared_logic.py) | The corpus, the embedding model and the scoring that all methods share |

Tests: [`backend/tests/unit/similarity_metrics`](../../tests/unit/similarity_metrics).

## clustering

Groups questions that are about the same thing, so a recurring inquiry can be counted and compared with the routines as one unit.

| File | What it does |
|---|---|
| [`question_clustering.py`](clustering/question_clustering.py) | Clusters the question embeddings into themes |
| [`cluster_titles.py`](clustering/cluster_titles.py) | Gets a short title for a cluster from the language model |
| [`title_cache.py`](clustering/title_cache.py) | Remembers the titles in `data/processed/cluster_title_cache.json`, so a cluster is not sent to the model twice. The file is made from ticket text and is gitignored |

The groups end up in the snapshot through [`snapshot/question_groups.py`](../snapshot/question_groups.py). Tests: [`backend/tests/unit/clustering`](../../tests/unit/clustering).

## llm

[`ask_llm.py`](llm/ask_llm.py) asks the language model behind the LiteLLM proxy a question and returns its JSON answer. The proxy address, key and model name come from `LITELLM_API_URL`, `LITELLM_API_KEY` and `LITELLM_MODEL` in `.env`.

The text of a few questions per cluster is sent to the proxy, so it has to be a service approved for HR data. It is used by [`cluster_titles.py`](clustering/cluster_titles.py).

## evaluation

Measures the methods against the ground truth, a small hand-made table of which routines answer which questions. It lives in `data/raw/ground_truth.csv`, which is not in git, see [`data/raw`](../../../data/raw/README.md).

| File | What it measures |
|---|---|
| [`ground_truth_evaluation.py`](evaluation/ground_truth_evaluation.py) | How well a similarity method finds the right routine, and how well it gives low scores to questions that have no routine (the knowledge gaps) |
| [`candidate_coverage.py`](evaluation/candidate_coverage.py) | How often a relevant routine is among the top candidates of one or several methods |
| [`cluster_validation.py`](evaluation/cluster_validation.py) | Whether questions that share a relevant routine land in the same theme |

The ground truth covers few questions, so read the results with their intervals. These run through [`backend/scripts/`](../../scripts/README.md): `evaluate_similarity.py`, `measure_candidate_coverage.py` and `validate_clusters.py`. Tests: [`backend/tests/unit/evaluation`](../../tests/unit/evaluation).
