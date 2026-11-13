"""
Compares clustering strategies against the ground truth and prints one row
each. A pair of questions counts as right when they share any routine the
ground truth lists as relevant. Prints only counts and scores, never question
text. The ground truth covers few questions, so read the interval before the
score: strategies whose intervals overlap cannot be told apart.
"""

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering, KMeans
from umap import UMAP

from backend.ai.clustering.question_clustering import (
    CLUSTERING_MODEL_NAME,
    NOISE_LABEL,
    center_embeddings,
    cluster_questions,
)
from backend.ai.evaluation.cluster_validation import routine_pair_agreement, routine_purity, summarize_themes
from backend.ai.evaluation.ground_truth_evaluation import load_ground_truth
from backend.ai.similarity_metrics.shared_logic import extract_questions

SUBSAMPLE_RUNS = 500
SUBSAMPLE_SHARE = 0.8
SHUFFLE_RUNS = 200
RANDOM_SEED = 0


def cluster_with_umap(embeddings):
    """
    Clusters in ten dimensions found by UMAP, which is how BERTopic does it.
    """
    reduced = UMAP(n_components=10, metric="cosine", random_state=RANDOM_SEED).fit_transform(embeddings)

    return cluster_questions(reduced)


def strategies():
    """
    Returns the strategies to compare, each as a function from embeddings to one label per question.
    """
    named = {
        "hdbscan leaf 3 (current)": lambda e: cluster_questions(e),
        "hdbscan eom 3": lambda e: cluster_questions(e, cluster_selection_method="eom"),
        "hdbscan leaf 3 on umap": cluster_with_umap,
    }
    for threshold in [0.7, 0.8, 0.9]:
        named[f"agglomerative, distance {threshold}"] = lambda e, t=threshold: AgglomerativeClustering(
            n_clusters=None, distance_threshold=t, metric="cosine", linkage="average"
        ).fit_predict(center_embeddings(e))
    for clusters in [20, 40, 80]:
        named[f"kmeans k={clusters}"] = lambda e, k=clusters: KMeans(
            n_clusters=k, n_init=10, random_state=RANDOM_SEED
        ).fit_predict(center_embeddings(e))

    return named


def pair_f1_interval(labels, relevant_routine_ids):
    """
    Scores the pair F1 on random 80 % samples of the ground truth questions and
    returns the 10th and 90th percentile, which shows how much it depends on which questions were asked.
    """
    random = np.random.default_rng(RANDOM_SEED)
    scores = []

    for _ in range(SUBSAMPLE_RUNS):
        sample = random.choice(len(labels), int(len(labels) * SUBSAMPLE_SHARE), replace=False)
        scores.append(routine_pair_agreement(labels[sample], [relevant_routine_ids[i] for i in sample])["f1"])

    return np.percentile(scores, [10, 90])


def shuffled_f1(labels, relevant_routine_ids):
    """
    Returns the mean pair F1 when the themes are dealt out at random among the
    ground truth questions, which is what no real signal looks like.
    """
    random = np.random.default_rng(RANDOM_SEED)

    return float(
        np.mean(
            [
                routine_pair_agreement(random.permutation(labels), relevant_routine_ids)["f1"]
                for _ in range(SHUFFLE_RUNS)
            ]
        )
    )


def evaluate_strategy(cluster, embeddings, questions, ground_truth):
    """
    Returns one row of numbers for one strategy.
    """
    labels = cluster(embeddings)
    covered = ground_truth.index.intersection(questions.index)
    truth_labels = labels[questions.index.get_indexer(covered)]
    relevant = list(ground_truth.loc[covered, "relevant_routine_ids"])
    agreement = routine_pair_agreement(truth_labels, relevant)
    purity, purity_based_on = routine_purity(truth_labels, relevant)
    low, high = pair_f1_interval(truth_labels, relevant)
    summary = summarize_themes(labels)
    gap_labels = truth_labels[(ground_truth.loc[covered, "source_type"] == "no_source").to_numpy()]

    return {
        "themes": summary["themes"],
        "noise": summary["noise_share"],
        "largest": summary["largest_size"],
        "precision": agreement["precision"],
        "recall": agreement["recall"],
        "f1": agreement["f1"],
        "f1 range": f"{low:.2f}-{high:.2f}",
        "f1 shuffled": shuffled_f1(truth_labels, relevant),
        "purity": purity,
        "purity of": purity_based_on,
        "gaps in theme": f"{(gap_labels != NOISE_LABEL).sum()}/{len(gap_labels)}",
    }


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx", ground_truth_path="data/raw/ground_truth.csv"):
    """
    Embeds the questions once and prints one row per strategy.
    """
    questions = extract_questions(questions_path)
    ground_truth = load_ground_truth(ground_truth_path)
    embeddings = SentenceTransformer(CLUSTERING_MODEL_NAME).encode(
        questions["text"].tolist(), normalize_embeddings=True
    )

    rows = {
        name: evaluate_strategy(cluster, embeddings, questions, ground_truth) for name, cluster in strategies().items()
    }

    print(f"{len(questions)} questions, {len(ground_truth)} with a ground truth")
    print(pd.DataFrame(rows).T.round(2).to_string())


if __name__ == "__main__":
    main()
