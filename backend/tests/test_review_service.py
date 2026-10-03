import pytest

from services import review_service

QUIZ = [{"question": f"Q{i}?", "answer": f"A{i}", "source_quote": "q"} for i in range(1, 5)]
CHAPTER = {
    "title": "Cells",
    "concepts": [{"name": "ATP", "explanation": "x", "source_quote": "q"}],
    "quiz": QUIZ,
    "misconception": {"wrong_claim": "Ribosomes make ATP.", "correction": "Mitochondria make ATP.", "source_quote": "q"},
}


def turn(role, text):
    return {"role": role, "text": text}


@pytest.fixture
def fake_gemini(monkeypatch):
    calls = []

    def fake(prompt, system=None, schema=None):
        calls.append(prompt)
        return {"reply": "Gemini says hi."}

    monkeypatch.setattr(review_service.gemini_client, "generate_json", fake)
    return calls


def test_quiz_opens_with_first_question_without_calling_model(fake_gemini):
    out = review_service.next_turn(CHAPTER, "quiz", [], None)
    assert "Q1?" in out["reply"] and out["done"] is False
    assert fake_gemini == []


def test_quiz_reacts_then_asks_next_question(fake_gemini):
    transcript = [turn("character", "Q1?")]
    out = review_service.next_turn(CHAPTER, "quiz", transcript, "my answer")
    assert out["reply"].startswith("Gemini says hi.") and out["reply"].endswith("Q2?")
    assert out["done"] is False
    prompt = fake_gemini[0]
    assert "Q1?" in prompt and "A1" in prompt and "my answer" in prompt


def test_quiz_ends_after_three_questions(fake_gemini):
    transcript = [turn("character", "Q1?"), turn("student", "a"), turn("character", "Q2?"),
                  turn("student", "b"), turn("character", "Q3?")]
    out = review_service.next_turn(CHAPTER, "quiz", transcript, "c")
    assert out == {"reply": "Gemini says hi.", "done": True}


def test_quiz_with_fewer_questions_ends_early(fake_gemini):
    chapter = {**CHAPTER, "quiz": QUIZ[:1]}
    out = review_service.next_turn(chapter, "quiz", [turn("character", "Q1?")], "a")
    assert out["done"] is True and "Q2?" not in out["reply"]


def test_quiz_without_questions_is_an_error(fake_gemini):
    with pytest.raises(ValueError):
        review_service.next_turn({**CHAPTER, "quiz": []}, "quiz", [], None)


def test_teachback_opens_with_planted_claim_without_calling_model(fake_gemini):
    out = review_service.next_turn(CHAPTER, "teachback", [], None)
    assert "Ribosomes make ATP." in out["reply"] and out["done"] is False
    assert fake_gemini == []


def test_teachback_reply_uses_claim_and_correction(fake_gemini):
    transcript = [turn("character", "Ribosomes make ATP.")]
    out = review_service.next_turn(CHAPTER, "teachback", transcript, "No, mitochondria do.")
    assert out == {"reply": "Gemini says hi.", "done": False}
    prompt = fake_gemini[0]
    assert "Ribosomes make ATP." in prompt and "Mitochondria make ATP." in prompt
    assert "No, mitochondria do." in prompt


def test_teachback_ends_after_three_student_turns(fake_gemini):
    transcript = [turn("character", "c"), turn("student", "1"), turn("character", "c"),
                  turn("student", "2"), turn("character", "c")]
    assert review_service.next_turn(CHAPTER, "teachback", transcript, "3")["done"] is True


def test_teachback_without_misconception_is_an_error(fake_gemini):
    with pytest.raises(ValueError):
        review_service.next_turn({**CHAPTER, "misconception": None}, "teachback", [], None)


def test_empty_message_mid_conversation_is_an_error(fake_gemini):
    with pytest.raises(ValueError):
        review_service.next_turn(CHAPTER, "quiz", [turn("character", "Q1?")], "  ")


def test_unknown_mode_is_an_error(fake_gemini):
    with pytest.raises(ValueError):
        review_service.next_turn(CHAPTER, "debate", [], None)


def test_quiz_skip_reveals_answer_and_asks_next_without_calling_model(fake_gemini):
    out = review_service.next_turn(CHAPTER, "quiz", [turn("character", "Q1?")], None, skip=True)
    assert "A1" in out["reply"] and out["reply"].endswith("Q2?")
    assert out["done"] is False
    assert fake_gemini == []


def test_quiz_skip_on_last_question_ends(fake_gemini):
    transcript = [turn("character", "Q1?"), turn("student", "a"), turn("character", "Q2?"),
                  turn("student", "b"), turn("character", "Q3?")]
    out = review_service.next_turn(CHAPTER, "quiz", transcript, None, skip=True)
    assert "A3" in out["reply"] and out["done"] is True


def test_skip_is_only_for_quiz(fake_gemini):
    with pytest.raises(ValueError):
        review_service.next_turn(CHAPTER, "teachback", [turn("character", "c")], None, skip=True)


def test_skip_before_first_question_is_an_error(fake_gemini):
    with pytest.raises(ValueError):
        review_service.next_turn(CHAPTER, "quiz", [], None, skip=True)
