import pytest

from app import create_app


@pytest.fixture
def client():
    return create_app().test_client()


def test_config_endpoint_text_mode(client, monkeypatch):
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    monkeypatch.delenv("ELEVENLABS_AGENT_ID", raising=False)
    monkeypatch.setenv("DEMO_MODE", "true")
    res = client.get("/api/config")
    assert res.status_code == 200
    assert res.get_json() == {"voice_available": False, "demo_mode": True}
