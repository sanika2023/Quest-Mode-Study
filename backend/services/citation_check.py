import logging
import re

log = logging.getLogger("citation_check")

_REPLACEMENTS = str.maketrans({
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-",
})


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.translate(_REPLACEMENTS).lower()).strip()


def citation_check(quote: str, notes: str) -> bool:
    """True only if the quote is a substring of the notes after normalization. Never calls a model."""
    q = normalize(quote or "")
    passed = bool(q) and q in normalize(notes)
    log.info("citation %s: %r", "pass" if passed else "FAIL", (quote or "")[:80])
    return passed
