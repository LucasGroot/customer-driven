"""
Tests how cluster titles are saved, using a temporary folder so the real saved
titles are never touched.
"""

import subprocess
from pathlib import Path

import pytest

from src.ai.clustering import title_cache
from src.ai.clustering.title_cache import cache_key, read_title_cache, save_title


@pytest.fixture(autouse=True)
def isolated_title_cache(tmp_path, monkeypatch):
    monkeypatch.setattr(title_cache, "TITLE_CACHE_PATH", tmp_path / "data" / "cluster_title_cache.json")


def test_nothing_is_saved_before_the_first_title():
    assert read_title_cache() == {}


def test_saved_titles_add_up_and_a_key_keeps_its_latest_title():
    save_title("a", "Første")
    save_title("b", "Andre")
    save_title("a", "Første på nytt")

    assert read_title_cache() == {"a": "Første på nytt", "b": "Andre"}


def test_norwegian_letters_survive_saving():
    save_title("a", "Lønn og tillegg på natt")

    assert read_title_cache() == {"a": "Lønn og tillegg på natt"}


def test_no_half_written_file_is_left_behind():
    save_title("a", "Første")

    assert [path.name for path in title_cache.TITLE_CACHE_PATH.parent.iterdir()] == ["cluster_title_cache.json"]


def test_the_key_depends_on_every_part_and_hides_the_text():
    assert cache_key("modell", "regler", "spørsmål") == cache_key("modell", "regler", "spørsmål")
    assert cache_key("modell", "regler", "spørsmål") != cache_key("annen", "regler", "spørsmål")
    assert cache_key("modell", "regler", "spørsmål") != cache_key("modell", "nye regler", "spørsmål")
    assert cache_key("modell", "regler", "spørsmål") != cache_key("modell", "regler", "annet")
    assert "spørsmål" not in cache_key("modell", "regler", "spørsmål")


def test_the_real_file_can_never_be_committed():
    # The real path, not the temporary one the other tests use
    real_path = Path(title_cache.__file__).resolve().parents[4] / "data" / "processed" / "cluster_title_cache.json"
    result = subprocess.run(["git", "check-ignore", "--quiet", str(real_path)], cwd=real_path.parent, check=False)

    if result.returncode == 128:
        pytest.skip("not inside a git checkout")
    assert result.returncode == 0
