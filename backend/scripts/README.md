[Project README](../../README.md) › Scripts

# Scripts

Run them from the project root with the virtual environment active, for example `python scripts/build_snapshot.py`. They use the data in [`data/raw`](../../data/raw/README.md) and write to the database or to [`data/processed`](../../data/processed/README.md). They print counts and scores, not question text.

| Script | What it does |
|---|---|
| [`build_snapshot.py`](build_snapshot.py) | Runs the whole analysis and stores the snapshot in the database. The same as "Kjør analyse" in the dashboard. Needs the database settings and `LITELLM_*` in `.env` |
| [`evaluate_similarity.py`](evaluate_similarity.py) | One row of metrics per similarity method, against the ground truth |
| [`check_similarity_metrics.py`](check_similarity_metrics.py) | A quick check that runs the methods on one corpus |
| [`measure_candidate_coverage.py`](measure_candidate_coverage.py) | How often the right routine is among the top candidates |
| [`cluster_questions.py`](cluster_questions.py) | Clusters the questions and prints how it came out |
| [`validate_clusters.py`](validate_clusters.py) | Compares clustering strategies against the ground truth |
| [`export_similarity_results.py`](export_similarity_results.py) | Exports the top matches per question to an xlsx file for manual inspection |

The code behind them is in [`backend/src/ai`](../src/ai/README.md) and [`backend/src/snapshot`](../src/snapshot/README.md).
