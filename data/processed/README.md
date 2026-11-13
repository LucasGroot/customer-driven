[Project README](../../README.md) › [Data](../README.md) › processed

# processed

What the code writes to disk. It is made from ticket text and is not in git.

- `cluster_title_cache.json`: the titles the language model gave to question clusters, so they are not asked for twice ([`title_cache.py`](../../backend/src/ai/clustering/title_cache.py)).
- `similarity_results.xlsx`: the export from [`backend/scripts/export_similarity_results.py`](../../backend/scripts/export_similarity_results.py).

The snapshot is not here. It is stored, encrypted, in the database, see [`backend/src/db`](../../backend/src/db/README.md).
