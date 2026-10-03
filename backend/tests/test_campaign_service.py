import pytest

from services import campaign_service

NOTES = (
    "Mitochondria produce ATP. Ribosomes build proteins. The nucleus stores DNA. "
    "Chloroplasts run photosynthesis. The Golgi apparatus packages proteins."
)


def concept(name, quote):
    return {"name": name, "explanation": "x", "source_quote": quote}


def chapter(position, concepts, quiz=None, misconception=None):
    return {
        "position": position,
        "title": f"Chapter {position}",
        "story_beat": "story",
        "concepts": concepts,
        "quiz": quiz if quiz is not None else [],
        "misconception": misconception,
    }


def good_chapter(position=1):
    return chapter(
        position,
        [concept("ATP", "Mitochondria produce ATP."), concept("Proteins", "Ribosomes build proteins.")],
        quiz=[{"question": "q?", "answer": "a", "source_quote": "The nucleus stores DNA."}],
        misconception={"wrong_claim": "w", "correction": "c", "source_quote": "Chloroplasts run photosynthesis."},
    )


@pytest.fixture
def fake_gemini(monkeypatch):
    calls = []

    def install(*responses):
        queue = list(responses)

        def fake(prompt, system=None, schema=None):
            calls.append(prompt)
            return queue.pop(0)

        monkeypatch.setattr(campaign_service.gemini_client, "generate_json", fake)
        return calls

    return install


@pytest.mark.parametrize("minutes,expected", [(10, 1), (30, 1), (60, 2), (120, 4), (600, 6)])
def test_chapter_count(minutes, expected):
    assert campaign_service.chapter_count(minutes) == expected


def test_keeps_verified_content_and_puts_notes_in_prompt(fake_gemini):
    calls = fake_gemini({"title": "T", "premise": "P", "chapters": [good_chapter()]})
    result = campaign_service.generate_campaign(60, notes_text=NOTES)
    ch = result["chapters"][0]
    assert len(ch["concepts"]) == 2 and len(ch["quiz"]) == 1 and ch["misconception"]
    assert len(calls) == 1
    assert NOTES in calls[0] and "2" in calls[0]


def test_drops_items_with_unverified_quotes(fake_gemini):
    bad = chapter(
        1,
        [
            concept("ATP", "Mitochondria produce ATP."),
            concept("Proteins", "Ribosomes build proteins."),
            concept("Invented", "Lysosomes digest everything."),
        ],
        quiz=[{"question": "q?", "answer": "a", "source_quote": "Not in the notes at all."}],
        misconception={"wrong_claim": "w", "correction": "c", "source_quote": "Made up quote."},
    )
    fake_gemini({"title": "T", "premise": "P", "chapters": [bad]})
    ch = campaign_service.generate_campaign(30, notes_text=NOTES)["chapters"][0]
    assert [c["name"] for c in ch["concepts"]] == ["ATP", "Proteins"]
    assert ch["quiz"] == []
    assert ch["misconception"] is None


def test_regenerates_a_thin_chapter_once(fake_gemini):
    thin = chapter(2, [concept("ATP", "Mitochondria produce ATP."), concept("Bad", "Fake quote.")])
    calls = fake_gemini(
        {"title": "T", "premise": "P", "chapters": [good_chapter(1), thin]},
        {"title": "T", "premise": "P", "chapters": [good_chapter(1)]},
    )
    result = campaign_service.generate_campaign(60, notes_text=NOTES)
    assert len(calls) == 2
    assert [c["position"] for c in result["chapters"]] == [1, 2]
    assert len(result["chapters"][1]["concepts"]) == 2
    assert "Chapter 2" in calls[1]


def test_regenerates_only_once_even_if_still_thin(fake_gemini):
    thin = chapter(1, [concept("Bad", "Fake quote.")])
    calls = fake_gemini(
        {"title": "T", "premise": "P", "chapters": [thin]},
        {"title": "T", "premise": "P", "chapters": [thin]},
    )
    result = campaign_service.generate_campaign(30, notes_text=NOTES)
    assert len(calls) == 2
    assert result["chapters"][0]["concepts"] == []


def test_topic_only_skips_citation_check(fake_gemini):
    unverifiable = chapter(1, [concept("A", "anything"), concept("B", "anything else")])
    calls = fake_gemini({"title": "T", "premise": "P", "chapters": [unverifiable]})
    result = campaign_service.generate_campaign(30, topic="Cell biology")
    assert len(calls) == 1
    assert len(result["chapters"][0]["concepts"]) == 2
    assert "Cell biology" in calls[0]
