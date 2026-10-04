from services import gemini_client, prompts

MAX_QUIZ_QUESTIONS = 3
MAX_TEACHBACK_TURNS = 3

_REPLY = {"type": "OBJECT", "properties": {"reply": {"type": "STRING"}}, "required": ["reply"]}


def _ask(prompt_name, **values):
    return gemini_client.generate_json(prompts.load(prompt_name, **values), schema=_REPLY)["reply"]


def next_turn(chapter, mode, transcript, message, skip=False):
    """One character turn. With no message it is the opening, built from saved data without a model call.

    skip (quiz only) reveals the answer and moves on, also without a model call."""
    message = (message or "").strip()
    if skip and mode != "quiz":
        raise ValueError("Only quiz questions can be skipped")
    if skip and not transcript:
        raise ValueError("Nothing to skip yet")
    if not message and transcript and not skip:
        raise ValueError("message is required")
    if mode == "quiz":
        return _quiz_turn(chapter, transcript, message, skip)
    if mode == "teachback":
        return _teachback_turn(chapter, transcript, message)
    raise ValueError("mode must be quiz or teachback")


def _quiz_turn(chapter, transcript, message, skip):
    questions = chapter["quiz"][:MAX_QUIZ_QUESTIONS]
    if not questions:
        raise ValueError("This chapter has no quiz questions")
    if not message and not skip:
        return {"reply": f"Let us test your knowledge. {questions[0]['question']}", "done": False}
    answered = sum(t["role"] == "student" for t in transcript) + 1
    asked = questions[answered - 1]
    if skip:
        reply = f"Skipped. The answer was: {asked['answer']}"
    else:
        reply = _ask(
            "character_quiz.md",
            chapter_title=chapter["title"],
            question=asked["question"],
            reference_answer=asked["answer"],
            transcript=prompts.format_transcript(transcript),
            message=message,
        )
    if answered >= len(questions):
        return {"reply": reply, "done": True}
    return {"reply": f"{reply}\n\n{questions[answered]['question']}", "done": False}


def _teachback_turn(chapter, transcript, message):
    claim = chapter["misconception"]
    if not claim:
        raise ValueError("This chapter has no misconception to teach back")
    if not message:
        return {"reply": f"I have been studying, and I am quite sure of this: {claim['wrong_claim']}", "done": False}
    reply = _ask(
        "character_teachback.md",
        chapter_title=chapter["title"],
        wrong_claim=claim["wrong_claim"],
        correction=claim["correction"],
        transcript=prompts.format_transcript(transcript),
        message=message,
    )
    turns = sum(t["role"] == "student" for t in transcript) + 1
    return {"reply": reply, "done": turns >= MAX_TEACHBACK_TURNS}
