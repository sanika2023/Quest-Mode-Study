import pytest

import db
from app import create_app
from services import grading_service

CHAPTER = {"id": "ch1", "title": "T"}
TRANSCRIPT = [{"role": "student", "text": "x"}]
RESULTS = [{"concept": "ATP", "verdict": "missed"}]


@pytest.fixture
def client():
    return create_app().test_client()


@pytest.fixture
def fakes(monkeypatch):
    seen = {}

    def grade(chapter, mode, transcript, notes):
        seen["grade"] = (chapter, mode, transcript, notes)
        return RESULTS

    monkeypatch.setattr(db, "get_chapter", lambda cid: CHAPTER if cid == "ch1" else None)
    monkeypatch.setattr(db, "get_notes", lambda cid: "the notes")
    monkeypatch.setattr(db, "record_grading", lambda *a: seen.setdefault("record", a))
    monkeypatch.setattr(grading_service, "grade", grade)
    monkeypatch.setattr(grading_service, "villains_for", lambda chapter, results: ["villain"])
    return seen


def post(client, chapter_id="ch1", **body):
    return client.post(f"/api/chapters/{chapter_id}/grade", json={"mode": "quiz", "transcript": TRANSCRIPT, **body})


def test_grade_returns_results_and_records_them(client, fakes):
    res = post(client)
    assert res.status_code == 200
    assert res.get_json() == {"results": RESULTS}
    assert fakes["grade"] == (CHAPTER, "quiz", TRANSCRIPT, "the notes")
    assert fakes["record"] == ("ch1", "quiz", RESULTS, ["villain"])


def test_practice_grades_without_recording(client, fakes):
    res = post(client, practice=True)
    assert res.status_code == 200
    assert res.get_json() == {"results": RESULTS}
    assert "record" not in fakes


def test_practice_must_be_boolean(client, fakes):
    assert post(client, practice="yes").status_code == 400


def test_unknown_chapter_is_404(client, fakes):
    assert post(client, chapter_id="nope").status_code == 404


@pytest.mark.parametrize("body", [{"mode": "debate"}, {"transcript": "x"}])
def test_bad_input_is_400(client, fakes, body):
    assert post(client, **body).status_code == 400
    assert "grade" not in fakes


def test_value_error_is_400(client, fakes, monkeypatch):
    def refuse(*a):
        raise ValueError("No student answers to grade")

    monkeypatch.setattr(grading_service, "grade", refuse)
    assert post(client).status_code == 400


def test_model_failure_is_502_and_nothing_recorded(client, fakes, monkeypatch):
    def boom(*a):
        raise RuntimeError("down")

    monkeypatch.setattr(grading_service, "grade", boom)
    assert post(client).status_code == 502
    assert "record" not in fakes
