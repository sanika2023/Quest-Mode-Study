import config


def test_voice_unavailable_when_unset(monkeypatch):
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    monkeypatch.delenv("ELEVENLABS_AGENT_ID", raising=False)
    assert config.voice_available() is False


def test_voice_unavailable_when_only_key_set(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "k")
    monkeypatch.delenv("ELEVENLABS_AGENT_ID", raising=False)
    assert config.voice_available() is False


def test_voice_available_when_both_set(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "k")
    monkeypatch.setenv("ELEVENLABS_AGENT_ID", "a")
    assert config.voice_available() is True


def test_demo_mode_parsing(monkeypatch):
    monkeypatch.delenv("DEMO_MODE", raising=False)
    assert config.demo_mode() is False
    monkeypatch.setenv("DEMO_MODE", "true")
    assert config.demo_mode() is True
    monkeypatch.setenv("DEMO_MODE", "false")
    assert config.demo_mode() is False
