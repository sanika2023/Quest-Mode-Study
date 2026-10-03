import io

import pytest

import db
from app import create_app
from services import campaign_service, pdf_text

GENERATED = {"title": "T", "premise": "P", "chapters": []}
SAVED = {"id": "abc", "title": "T", "premise": "P", "has_notes": True, "chapters": []}


@pytest.fixture
def client():
    return create_app().test_client()


@pytest.fixture
def fakes(monkeypatch):
    seen = {}

    def generate(planned_minutes, notes_text=None, topic=None):
        seen["generate"] = (planned_minutes, notes_text, topic)
        return GENERATED

    def save(campaign, notes_text):
        seen["save"] = (campaign, notes_text)
        return "abc"

    monkeypatch.setattr(campaign_service, "generate_campaign", generate)
    monkeypatch.setattr(db, "save_campaign", save)
    monkeypatch.setattr(db, "get_campaign", lambda cid: SAVED if cid == "abc" else None)
    return seen


def test_post_notes_text(client, fakes):
    res = client.post("/api/campaigns", json={"notes_text": "some notes", "planned_minutes": 60})
    assert res.status_code == 201
    assert res.get_json() == SAVED
    assert fakes["generate"] == (60, "some notes", None)
    assert fakes["save"] == (GENERATED, "some notes")


def test_post_topic(client, fakes):
    res = client.post("/api/campaigns", json={"topic": "Cell biology", "planned_minutes": 30})
    assert res.status_code == 201
    assert fakes["generate"] == (30, None, "Cell biology")
    assert fakes["save"] == (GENERATED, None)


def test_post_pdf(client, fakes, monkeypatch):
    monkeypatch.setattr(pdf_text, "extract_text", lambda f: "text from pdf")
    res = client.post(
        "/api/campaigns",
        data={"planned_minutes": "60", "file": (io.BytesIO(b"%PDF"), "notes.pdf")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 201
    assert fakes["generate"] == (60, "text from pdf", None)


def test_post_pdf_without_text_is_rejected(client, fakes, monkeypatch):
    monkeypatch.setattr(pdf_text, "extract_text", lambda f: "  ")
    res = client.post(
        "/api/campaigns",
        data={"planned_minutes": "60", "file": (io.BytesIO(b"%PDF"), "scan.pdf")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 400
    assert "generate" not in fakes


@pytest.mark.parametrize("body", [
    {"notes_text": "n"},
    {"notes_text": "n", "planned_minutes": 0},
    {"notes_text": "n", "planned_minutes": "abc"},
    {"planned_minutes": 30},
])
def test_post_validation(client, fakes, body):
    res = client.post("/api/campaigns", json=body)
    assert res.status_code == 400
    assert "generate" not in fakes


def test_post_generation_failure_is_502(client, fakes, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("gemini down")

    monkeypatch.setattr(campaign_service, "generate_campaign", boom)
    res = client.post("/api/campaigns", json={"notes_text": "n", "planned_minutes": 30})
    assert res.status_code == 502
    assert "error" in res.get_json()


def test_get_reads_db_and_never_calls_model(client, fakes, monkeypatch):
    def forbidden(*a, **k):
        raise AssertionError("model called on GET")

    monkeypatch.setattr(campaign_service, "generate_campaign", forbidden)
    assert client.get("/api/campaigns/abc").get_json() == SAVED


def test_get_unknown_is_404(client, fakes):
    assert client.get("/api/campaigns/nope").status_code == 404


@pytest.fixture
def chapter_fake(monkeypatch):
    seen = {}

    def update(chapter_id, status):
        seen["update"] = (chapter_id, status)
        return {"id": chapter_id, "status": status} if chapter_id == "ch1" else None

    monkeypatch.setattr(db, "update_chapter_status", update)
    return seen


def test_patch_chapter_status(client, chapter_fake):
    res = client.patch("/api/chapters/ch1", json={"status": "done"})
    assert res.status_code == 200
    assert res.get_json() == {"id": "ch1", "status": "done"}
    assert chapter_fake["update"] == ("ch1", "done")


@pytest.mark.parametrize("body", [{}, {"status": "bogus"}])
def test_patch_chapter_rejects_bad_status(client, chapter_fake, body):
    assert client.patch("/api/chapters/ch1", json=body).status_code == 400
    assert "update" not in chapter_fake


def test_patch_unknown_chapter_is_404(client, chapter_fake):
    assert client.patch("/api/chapters/nope", json={"status": "done"}).status_code == 404
