from pathlib import Path

PROMPTS = Path(__file__).parent.parent / "prompts"


def load(name, **values):
    """Read a prompt file and fill its {{key}} placeholders."""
    text = (PROMPTS / name).read_text(encoding="utf-8")
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", str(value))
    return text
