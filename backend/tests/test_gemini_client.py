import pytest

from services import gemini_client


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModels:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.models_called = []

    def generate_content(self, model, contents, config):
        self.models_called.append(model)
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return FakeResponse(outcome)


class FakeClient:
    def __init__(self, outcomes):
        self.models = FakeModels(outcomes)


@pytest.fixture
def use_client(monkeypatch):
    monkeypatch.setenv("GEMINI_MODEL", "primary")
    monkeypatch.setenv("GEMINI_FALLBACK_MODEL", "fallback")

    def install(outcomes):
        client = FakeClient(outcomes)
        monkeypatch.setattr(gemini_client, "_client", lambda: client)
        return client.models

    return install


def test_returns_parsed_json(use_client):
    models = use_client(['{"a": 1}'])
    assert gemini_client.generate_json("hi") == {"a": 1}
    assert models.models_called == ["primary"]


def test_retries_primary_once_then_succeeds(use_client):
    models = use_client([RuntimeError("boom"), '{"a": 2}'])
    assert gemini_client.generate_json("hi") == {"a": 2}
    assert models.models_called == ["primary", "primary"]


def test_falls_back_after_two_primary_failures(use_client):
    models = use_client([RuntimeError("1"), RuntimeError("2"), '{"a": 3}'])
    assert gemini_client.generate_json("hi") == {"a": 3}
    assert models.models_called == ["primary", "primary", "fallback"]


def test_bad_json_counts_as_failure(use_client):
    models = use_client(["not json", '{"a": 4}'])
    assert gemini_client.generate_json("hi") == {"a": 4}
    assert models.models_called == ["primary", "primary"]


def test_raises_when_everything_fails(use_client):
    use_client([RuntimeError("1"), RuntimeError("2"), RuntimeError("3")])
    with pytest.raises(RuntimeError):
        gemini_client.generate_json("hi")
