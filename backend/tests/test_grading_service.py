import pytest

from services import grading_service

NOTES = "Mitochondria produce ATP. Ribosomes build proteins. The nucleus stores DNA. Cytoplasm is gel."
QUIZ = [
    {"question": "What makes ATP?", "answer": "Mitochondria", "source_quote": "Mitochondria produce ATP."},
    {"question": "Where is DNA?", "answer": "Nucleus", "source_quote": "The nucleus stores DNA."},
    {"question": "What is cytoplasm?", "answer": "A gel", "source_quote": "Cytoplasm is a fluid."},
    {"question": "Fourth?", "answer": "x", "source_quote": "Cytoplasm is gel."},
]
CHAPTER = {
    "title": "Cells",
    "quiz": QUIZ,
    "misconception": {"wrong_claim": "Ribosomes make ATP.", "correction": "Mitochondria make ATP.", "source_quote": "q"},
    "concepts": [
        {"name": "ATP", "explanation": "Energy currency", "source_quote": "Mitochondria produce ATP."},
        {"name": "Proteins", "explanation": "Built by ribosomes", "source_quote": "Ribosomes build proteins."},
    ],
}


def turn(role, text):
    return {"role": role, "text": text}


QUIZ_TRANSCRIPT = [
    turn("character", "What makes ATP?"), turn("student", "Ribosomes"),
    turn("character", "Where is DNA?"), turn("student", "Nucleus"),
    turn("character", "What is cytoplasm?"), turn("student", "(skipped)"),
]
TEACH_TRANSCRIPT = [turn("character", "Ribosomes make ATP."), turn("student", "No, mitochondria do.")]


def q_result(number, topic, verdict="correct"):
    return {"question": number, "topic": topic, "verdict": verdict, "student_said": "said"}


def c_result(concept, verdict="correct", quote="Mitochondria produce ATP."):
    return {"concept": concept, "verdict": verdict, "student_said": "said", "source_quote": quote}


@pytest.fixture
def fake_gemini(monkeypatch):
    calls = []

    def install(*results):
        def fake(prompt, system=None, schema=None):
            calls.append({"prompt": prompt, "schema": schema})
            return {"results": list(results)}

        monkeypatch.setattr(grading_service.gemini_client, "generate_json", fake)
        return calls

    return install


# Quiz: one result per question asked, cited with that question's saved quote.

def test_quiz_grades_each_question_with_its_quote(fake_gemini):
    fake_gemini(q_result(1, "ATP source", "wrong"), q_result(2, "DNA location"), q_result(3, "Cytoplasm", "missed"))
    out = grading_service.grade(CHAPTER, "quiz", QUIZ_TRANSCRIPT, NOTES)
    assert out == [
        {"concept": "ATP source", "verdict": "wrong", "student_said": "said",
         "source_quote": "Mitochondria produce ATP.", "quote_verified": True},
        {"concept": "DNA location", "verdict": "correct", "student_said": "said",
         "source_quote": "The nucleus stores DNA.", "quote_verified": True},
        {"concept": "Cytoplasm", "verdict": "missed", "student_said": "said",
         "source_quote": "Cytoplasm is a fluid.", "quote_verified": False},
    ]


def test_quiz_ignores_unasked_or_duplicate_questions_and_bad_verdicts(fake_gemini):
    transcript = QUIZ_TRANSCRIPT[:2]
    fake_gemini(q_result(1, "ATP"), q_result(1, "Again"), q_result(2, "Not asked"), q_result(0, "Zero"))
    out = grading_service.grade(CHAPTER, "quiz", transcript, NOTES)
    assert [r["concept"] for r in out] == ["ATP"]


def test_quiz_blank_topic_falls_back_to_question(fake_gemini):
    fake_gemini(q_result(1, "  "))
    assert grading_service.grade(CHAPTER, "quiz", QUIZ_TRANSCRIPT[:2], NOTES)[0]["concept"] == "What makes ATP?"


def test_quiz_prompt_lists_only_asked_questions_and_not_the_notes(fake_gemini):
    calls = fake_gemini()
    grading_service.grade(CHAPTER, "quiz", QUIZ_TRANSCRIPT[:4], NOTES + " Secret extra sentence.")
    prompt = calls[0]["prompt"]
    assert "What makes ATP?" in prompt and "Nucleus" in prompt and "Student: Ribosomes" in prompt
    assert "What is cytoplasm?" not in prompt
    assert "Secret extra sentence" not in prompt


def test_topic_only_mode_skips_the_check(fake_gemini):
    fake_gemini(q_result(1, "ATP"))
    assert grading_service.grade(CHAPTER, "quiz", QUIZ_TRANSCRIPT[:2], None)[0]["quote_verified"] is None


# Teach-back: graded against the chapter's concepts.

def test_teachback_schema_restricts_concept_to_chapter_names(fake_gemini):
    calls = fake_gemini(c_result("ATP", "correct"))
    out = grading_service.grade(CHAPTER, "teachback", TEACH_TRANSCRIPT, NOTES)
    concept = calls[0]["schema"]["properties"]["results"]["items"]["properties"]["concept"]
    assert concept["enum"] == ["ATP", "Proteins"]
    assert "Ribosomes make ATP." in calls[0]["prompt"] and "Mitochondria make ATP." in calls[0]["prompt"]
    assert out == [{**c_result("ATP"), "quote_verified": True}]


def test_teachback_drops_unknown_concepts_and_canonicalizes_names(fake_gemini):
    fake_gemini(c_result("Invented"), c_result("  atp "), c_result("Proteins", "great"))
    out = grading_service.grade(CHAPTER, "teachback", TEACH_TRANSCRIPT, NOTES)
    assert [r["concept"] for r in out] == ["ATP"]


def test_requires_a_student_turn(fake_gemini):
    fake_gemini()
    with pytest.raises(ValueError):
        grading_service.grade(CHAPTER, "quiz", [turn("character", "Q?")], NOTES)


# Villains

def test_villains_are_missed_and_wrong_capped_at_two():
    results = [
        {**c_result("ATP", "missed")},
        {**c_result("Proteins", "partial")},
        {**c_result("Cytoplasm", "wrong", "Cytoplasm is a fluid.")},
        {**c_result("DNA", "missed", "The nucleus stores DNA.")},
    ]
    villains = grading_service.villains_for(CHAPTER, results)
    assert villains == [
        CHAPTER["concepts"][0],
        {"name": "Cytoplasm", "explanation": "A gel", "source_quote": "Cytoplasm is a fluid."},
    ]


def test_villains_none_when_all_correct():
    assert grading_service.villains_for(CHAPTER, [c_result("ATP", "correct")]) == []
