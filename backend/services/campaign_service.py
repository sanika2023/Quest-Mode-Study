from services import gemini_client, prompts
from services.citation_check import citation_check

MINUTES_PER_CHAPTER = 30
MAX_CHAPTERS = 6
MIN_CONCEPTS = 2

_STR = {"type": "STRING"}


def _obj(**props):
    return {"type": "OBJECT", "properties": props, "required": list(props)}


def _arr(item):
    return {"type": "ARRAY", "items": item}


_CHAPTER = _obj(
    position={"type": "INTEGER"},
    title=_STR,
    story_beat=_STR,
    concepts=_arr(_obj(name=_STR, explanation=_STR, source_quote=_STR)),
    quiz=_arr(_obj(question=_STR, answer=_STR, source_quote=_STR)),
    misconception=_obj(wrong_claim=_STR, correction=_STR, source_quote=_STR),
)
CAMPAIGN_SCHEMA = _obj(title=_STR, premise=_STR, chapters=_arr(_CHAPTER))


def chapter_count(planned_minutes: int) -> int:
    return max(1, min(MAX_CHAPTERS, planned_minutes // MINUTES_PER_CHAPTER))


def _verified(chapter, notes):
    """Keep only items whose quote is in the notes. Without notes (topic mode) nothing is checked."""
    if notes is None:
        return chapter

    def ok(item):
        return citation_check(item["source_quote"], notes)

    misconception = chapter.get("misconception")
    return {
        **chapter,
        "concepts": [c for c in chapter["concepts"] if ok(c)],
        "quiz": [q for q in chapter["quiz"] if ok(q)],
        "misconception": misconception if misconception and ok(misconception) else None,
    }


def generate_campaign(planned_minutes, notes_text=None, topic=None):
    """Call 1. Returns campaign JSON where every kept quote passed citation_check."""
    source = notes_text if notes_text is not None else topic
    raw = gemini_client.generate_json(
        prompts.load("campaign.md", chapter_count=chapter_count(planned_minutes), source=source),
        schema=CAMPAIGN_SCHEMA,
    )
    chapters = []
    for position, chapter in enumerate(raw["chapters"], start=1):
        chapter = _verified(chapter, notes_text)
        if notes_text is not None and len(chapter["concepts"]) < MIN_CONCEPTS:
            retry = gemini_client.generate_json(
                prompts.load("campaign_chapter.md", chapter_title=chapter["title"], source=source),
                schema=CAMPAIGN_SCHEMA,
            )
            chapter = _verified(retry["chapters"][0], notes_text)
        chapters.append({**chapter, "position": position})
    return {"title": raw["title"], "premise": raw["premise"], "chapters": chapters}
