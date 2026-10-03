import os

from dotenv import load_dotenv

load_dotenv()


def voice_available() -> bool:
    return bool(os.environ.get("ELEVENLABS_API_KEY") and os.environ.get("ELEVENLABS_AGENT_ID"))


def demo_mode() -> bool:
    return os.environ.get("DEMO_MODE", "false").lower() == "true"
