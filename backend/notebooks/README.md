[Project README](../../README.md) › Visualizations

# Visualizations

Notebooks for looking at how the methods behave. They are for exploring, not part of the app. They need the data in [`data/raw`](../../data/raw/README.md), so run them locally and do not publish their output.

| Notebook | Shows |
|---|---|
| [`fixed_chunking.ipynb`](fixed_chunking.ipynb) | How a document is split into pieces of a fixed size |
| [`customized_chunking.ipynb`](customized_chunking.ipynb) | How it is split along its headings, see [`chunking`](../src/ai/README.md#chunking) |
| [`euclidean_cosine_2_llm_comparison.ipynb`](euclidean_cosine_2_llm_comparison.ipynb) | Six retrieval methods compared (tf-idf, BM25, and cosine and Euclidean similarity on two embedding models), see [`similarity_metrics`](../src/ai/README.md#similarity_metrics) |
| [`question_embedding_views.ipynb`](question_embedding_views.ipynb) | The questions' embeddings seen from several angles: predefined categories against clusters, see [`clustering`](../src/ai/README.md#clustering) |

The routines and questions are real HR data. The committed notebooks have no output, and it has to stay that way: print only counts, never text, and strip a notebook's output (`nbstripout`) before you commit it.
