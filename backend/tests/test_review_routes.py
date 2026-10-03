import pytest

import db
from app import create_app
from services import review_service

CHAPTER = {"id": "ch1", "title": "T"}


@pytest.fixture
def client():
    return create_app().test_client()


@pytest.fixture
def fakes(monkeypatch):
    seen = {}

    def next_turn(chapter, mode, transcript, message, skip=False):
        seen["args"] = (chapter, mode, transcript, message, skip)
        return {"reply": "hello", "done": False}

    monkeypatch.setattr(db, "get_chapter", lambda cid: CHAPTER if cid == "ch1" else None)
    monkeypatch.setattr(review_service, "next_turn", next_turn)
    return seen


def post(client, **body):
    return client.post("/api/review/turn", json={"chapter_id": "ch1", "mode": "quiz", **body})


def test_turn_returns_reply(client, fakes):
    t = [{"role": "character", "text": "Q1?"}]
    res = post(client, transcript=t, message="my answer")
    assert res.status_code == 200
    assert res.get_json() == {"reply": "hello", "done": False}
    assert fakes["args"] == (CHAPTER, "quiz", t, "my answer", False)


def test_opening_turn_needs_no_message_or_transcript(client, fakes):
    assert post(client).status_code == 200
    assert fakes["args"] == (CHAPTER, "quiz", [], None, False)


def test_skip_flag_is_passed_through(client, fakes):
    post(client, transcript=[{"role": "character", "text": "Q1?"}], skip=True)
    assert fakes["args"][4] is True


def test_unknown_chapter_is_404(client, fakes):
    res = client.post("/api/review/turn", json={"chapter_id": "nope", "mode": "quiz"})
    assert res.status_code == 404


@pytest.mark.parametrize("body", [
    {"mode": "debate"},
    {"transcript": "not a list"},
    {"transcript": [{"role": "robot", "text": "x"}]},
    {"transcript": [{"role": "student"}]},
])
def test_bad_input_is_400(client, fakes, body):
    assert post(client, **body).status_code == 400
    assert "args" not in fakes


def test_service_value_error_is_400(client, fakes, monkeypatch):
    def refuse(*a, **k):
        raise ValueError("This chapter has no misconception")

    monkeypatch.setattr(review_service, "next_turn", refuse)
    res = post(client, mode="teachback")
    assert res.status_code == 400
    assert "misconception" in res.get_json()["error"]


def test_model_failure_is_502(client, fakes, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("gemini down")

    monkeypatch.setattr(review_service, "next_turn", boom)
    assert post(client).status_code == 502
