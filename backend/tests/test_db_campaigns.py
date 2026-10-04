import os

import pytest

import db

pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="DATABASE_URL not set")

CAMPAIGN = {
    "title": "The Test Keep",
    "premise": "A premise.",
    "chapters": [
        {
            "position": 1,
            "title": "One",
            "story_beat": "beat one",
            "concepts": [{"name": "A", "explanation": "x", "source_quote": "q"}],
            "quiz": [],
            "misconception": None,
        },
        {
            "position": 2,
            "title": "Two",
            "story_beat": "beat two",
            "concepts": [],
            "quiz": [],
            "misconception": {"wrong_claim": "w", "correction": "c", "source_quote": "q"},
        },
    ],
}


@pytest.fixture
def saved_id():
    campaign_id = db.save_campaign(CAMPAIGN, "the notes")
    yield campaign_id
    with db.connect() as conn:
        conn.execute("DELETE FROM campaigns WHERE id = %s", (campaign_id,))


def test_save_then_get_roundtrip(saved_id):
    got = db.get_campaign(saved_id)
    assert got["id"] == saved_id
    assert got["title"] == "The Test Keep"
    assert got["premise"] == "A premise."
    assert got["has_notes"] is True
    assert "notes_text" not in got
    first, second = got["chapters"]
    assert (first["position"], first["title"], first["status"]) == (1, "One", "active")
    assert (second["position"], second["status"]) == (2, "locked")
    assert first["story_beat"] == "beat one"
    assert first["concepts"][0]["name"] == "A"
    assert second["misconception"]["wrong_claim"] == "w"
    assert first["villains"] == []
    assert first["id"]


def test_topic_only_has_no_notes():
    campaign_id = db.save_campaign(CAMPAIGN, None)
    try:
        assert db.get_campaign(campaign_id)["has_notes"] is False
    finally:
        with db.connect() as conn:
            conn.execute("DELETE FROM campaigns WHERE id = %s", (campaign_id,))


def test_done_activates_next_chapter(saved_id):
    first, second = db.get_campaign(saved_id)["chapters"]
    updated = db.update_chapter_status(first["id"], "done")
    assert updated["status"] == "done"
    assert updated["title"] == "One"
    assert db.get_campaign(saved_id)["chapters"][1]["status"] == "active"


def test_status_change_without_done_leaves_next_locked(saved_id):
    first, _ = db.get_campaign(saved_id)["chapters"]
    db.update_chapter_status(first["id"], "active")
    assert db.get_campaign(saved_id)["chapters"][1]["status"] == "locked"


def test_update_unknown_chapter_returns_none():
    assert db.update_chapter_status("00000000-0000-0000-0000-000000000000", "done") is None
    assert db.update_chapter_status("not-a-uuid", "done") is None


def test_get_unknown_returns_none():
    assert db.get_campaign("00000000-0000-0000-0000-000000000000") is None
    assert db.get_campaign("not-a-uuid") is None


def test_get_chapter(saved_id):
    first, _ = db.get_campaign(saved_id)["chapters"]
    got = db.get_chapter(first["id"])
    assert got["title"] == "One" and got["concepts"][0]["name"] == "A"
    assert db.get_chapter("not-a-uuid") is None
    assert db.get_chapter("00000000-0000-0000-0000-000000000000") is None


def test_record_grading_writes_attempts_and_sets_next_villains(saved_id):
    first, second = db.get_campaign(saved_id)["chapters"]
    villain = {"name": "A", "explanation": "x", "source_quote": "q"}
    results = [{"concept": "A", "verdict": "missed"}, {"concept": "B", "verdict": "correct"}]
    db.record_grading(first["id"], "quiz", results, [villain])
    assert db.get_campaign(saved_id)["chapters"][1]["villains"] == [villain]
    with db.connect() as conn:
        rows = conn.execute(
            "SELECT concept, verdict, mode FROM attempts WHERE chapter_id = %s ORDER BY concept", (first["id"],)
        ).fetchall()
        conn.execute("DELETE FROM attempts WHERE chapter_id = %s", (first["id"],))
    assert rows == [
        {"concept": "A", "verdict": "missed", "mode": "quiz"},
        {"concept": "B", "verdict": "correct", "mode": "quiz"},
    ]


def test_regrading_replaces_villains_and_last_chapter_is_fine(saved_id):
    first, second = db.get_campaign(saved_id)["chapters"]
    db.record_grading(first["id"], "quiz", [], [{"name": "A"}])
    db.record_grading(first["id"], "quiz", [], [])
    assert db.get_campaign(saved_id)["chapters"][1]["villains"] == []
    db.record_grading(second["id"], "quiz", [], [{"name": "A"}])


def test_get_notes(saved_id):
    first, _ = db.get_campaign(saved_id)["chapters"]
    assert db.get_notes(first["id"]) == "the notes"
    assert db.get_notes("not-a-uuid") is None
