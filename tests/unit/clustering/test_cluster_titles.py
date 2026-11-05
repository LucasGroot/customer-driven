"""
Tests how a cluster is titled, with a made-up language model so no credentials or
confidential question text are needed.
"""

import pytest

from backend.ai.clustering import cluster_titles, title_cache
from backend.ai.clustering.cluster_titles import (
    MAX_QUESTIONS_IN_PROMPT,
    MAX_TITLE_CHARACTERS,
    build_title_prompt,
    title_cluster,
)


@pytest.fixture(autouse=True)
def isolated_title_cache(tmp_path, monkeypatch):
    """
    Keeps every test away from the real saved titles.
    """
    monkeypatch.setattr(title_cache, "TITLE_CACHE_PATH", tmp_path / "cluster_title_cache.json")


def answer_with(monkeypatch, answer):
    """
    Makes the language model give the same answer to every prompt, and returns the
    prompts it was given.
    """
    prompts = []

    def fake_ask_llm(system_prompt, prompt):
        prompts.append(prompt)
        return answer

    monkeypatch.setattr(cluster_titles, "ask_llm", fake_ask_llm)
    return prompts


def test_the_title_is_what_the_model_answers_on_one_line(monkeypatch):
    answer_with(monkeypatch, {"title": "  Overføring\nav ferie  "})

    assert title_cluster(["Hvor mye ferie kan jeg ta med?"]) == "Overføring av ferie"


def test_a_title_that_is_too_long_is_cut_short(monkeypatch):
    answer_with(monkeypatch, {"title": "ord " * 100})

    assert len(title_cluster(["Spørsmål"])) == MAX_TITLE_CHARACTERS


def test_the_question_that_stands_for_the_cluster_replaces_a_missing_title(monkeypatch):
    answer_with(monkeypatch, {"summary": "feil nøkkel"})

    assert title_cluster(["Hvem registrerer\nvaktbyttet?", "Annet"]) == "Hvem registrerer vaktbyttet?"


def test_the_prompt_lists_only_the_first_questions_on_one_line_each():
    texts = [f"Spørsmål\nnummer {number}" for number in range(MAX_QUESTIONS_IN_PROMPT + 5)]

    listed = build_title_prompt(texts).splitlines()

    assert listed[1:] == [f"- Spørsmål nummer {number}" for number in range(MAX_QUESTIONS_IN_PROMPT)]


def test_the_prompt_names_the_routine_only_when_there_is_one():
    assert "Ferierutine" in build_title_prompt(["Spørsmål"], routine_name="Ferierutine")
    assert "rutinen" not in build_title_prompt(["Spørsmål"])


def test_a_cluster_titled_before_is_not_sent_to_the_model_again(monkeypatch):
    prompts = answer_with(monkeypatch, {"title": "Overføring av ferie"})

    first = title_cluster(["Hvor mye ferie kan jeg ta med?"], routine_name="Ferierutine")
    second = title_cluster(["Hvor mye ferie kan jeg ta med?"], routine_name="Ferierutine")

    assert first == second == "Overføring av ferie"
    assert len(prompts) == 1


def test_titles_are_still_there_in_a_later_run(monkeypatch):
    answer_with(monkeypatch, {"title": "Overføring av ferie"})
    title_cluster(["Hvor mye ferie kan jeg ta med?"])

    # A later run is a new process, which only has the file to go by
    prompts = answer_with(monkeypatch, {"title": "Noe helt annet"})

    assert title_cluster(["Hvor mye ferie kan jeg ta med?"]) == "Overføring av ferie"
    assert prompts == []


def test_another_cluster_or_routine_or_model_is_titled_again(monkeypatch):
    prompts = answer_with(monkeypatch, {"title": "Tittel"})

    title_cluster(["Spørsmål"])
    title_cluster(["Annet spørsmål"])
    title_cluster(["Spørsmål"], routine_name="Ferierutine")
    monkeypatch.setenv("LITELLM_MODEL", "en-annen-modell")
    title_cluster(["Spørsmål"])

    assert len(prompts) == 4


def test_a_stand_in_for_a_missing_title_is_not_saved(monkeypatch):
    answer_with(monkeypatch, {"summary": "feil nøkkel"})
    title_cluster(["Spørsmål"])
    prompts = answer_with(monkeypatch, {"title": "Riktig tittel"})

    assert title_cluster(["Spørsmål"]) == "Riktig tittel"
    assert len(prompts) == 1
