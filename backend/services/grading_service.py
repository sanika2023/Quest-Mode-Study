import logging

from services import gemini_client, prompts
from services.citation_check import citation_check
from services.review_service import MAX_QUIZ_QUESTIONS

log = logging.getLogger(__name__)

MAX_VILLAINS = 2
VERDICTS = ["correct", "partial", "missed", "wrong"]
VILLAIN_VERDICTS = ("missed", "wrong")

_STR = {"type": "STRING"}
_VERDICT = {"type": "STRING", "enum": VERDICTS}


def _results_schema(props):
    item = {"type": "OBJECT", "properties": props, "required": list(props)}
    return {"type": "OBJECT", "properties": {"results": {"type": "ARRAY", "items": item}}, "required": ["results"]}


QUIZ_SCHEMA = _results_schema({"question": {"type": "INTEGER"}, "topic": _STR, "verdict": _VERDICT, "student_said": _STR})


def _teachback_schema(concept_names):
    # The enum forces the model to return exact concept names.
    return _results_schema({
        "concept": {"type": "STRING", "enum": concept_names},
        "verdict": _VERDICT,
        "student_said": _STR,
        "source_quote": _STR,
    })


def grade(chapter, mode, transcript, notes_text):
    """Call 2. Sees only the transcript and chapter data; notes_text is used afterwards for the citation check."""
    answered = sum(t["role"] == "student" for t in transcript)
    if not answered:
        raise ValueError("No student answers to grade")
    results = _grade_quiz(chapter, transcript, answered) if mode == "quiz" else _grade_teachback(chapter, transcript)
    for r in results:
        r["quote_verified"] = None if notes_text is None else citation_check(r["source_quote"], notes_text)
    return results


def _grade_quiz(chapter, transcript, answered):
    """One result per question asked, cited with that question's saved quote."""
    asked = chapter["quiz"][:min(answered, MAX_QUIZ_QUESTIONS)]
    questions = "\n".join(
        f"{i}. Question: {q['question']}\n   Reference answer: {q['answer']}" for i, q in enumerate(asked, start=1)
    )
    raw = gemini_client.generate_json(
        prompts.load(
            "grading_quiz.md",
            chapter_title=chapter["title"],
            questions=questions,
            transcript=prompts.format_transcript(transcript),
        ),
        schema=QUIZ_SCHEMA,
    )["results"]
    results, seen = [], set()
    for r in raw:
        n = r["question"]
        if not 1 <= n <= len(asked) or n in seen or r["verdict"] not in VERDICTS:
            log.warning("quiz result dropped: question %r (%s)", n, r["verdict"])
            continue
        seen.add(n)
        q = asked[n - 1]
        results.append({
            "concept": r["topic"].strip() or q["question"],
            "verdict": r["verdict"],
            "student_said": r["student_said"],
            "source_quote": q["source_quote"],
        })
    log.info("quiz grading kept %d of %d results", len(results), len(raw))
    return results


def _grade_teachback(chapter, transcript):
    concepts = "\n".join(
        f'- Name: "{c["name"]}"\n  Meaning: {c["explanation"]}\n  Excerpt: "{c["source_quote"]}"'
        for c in chapter["concepts"]
    )
    m = chapter["misconception"]
    raw = gemini_client.generate_json(
        prompts.load(
            "grading.md",
            chapter_title=chapter["title"],
            concepts=concepts,
            wrong_claim=m["wrong_claim"],
            correction=m["correction"],
            transcript=prompts.format_transcript(transcript),
        ),
        schema=_teachback_schema([c["name"] for c in chapter["concepts"]]),
    )["results"]
    names = {c["name"].strip().casefold(): c["name"] for c in chapter["concepts"]}
    results = []
    for r in raw:
        name = names.get(r["concept"].strip().casefold())
        if name is None or r["verdict"] not in VERDICTS:
            log.warning("teach-back result dropped: %r (%s)", r["concept"], r["verdict"])
            continue
        results.append({**r, "concept": name})
    log.info("teach-back grading kept %d of %d results", len(results), len(raw))
    return results


def villains_for(chapter, results):
    """Missed and wrong results, as concept objects, to carry into the next chapter."""
    concepts = {c["name"]: c for c in chapter["concepts"]}
    answers = {q["source_quote"]: q["answer"] for q in chapter["quiz"]}
    villains, names = [], set()
    for r in results:
        if r["verdict"] not in VILLAIN_VERDICTS or r["concept"] in names:
            continue
        names.add(r["concept"])
        villains.append(concepts.get(r["concept"]) or {
            "name": r["concept"],
            "explanation": answers.get(r["source_quote"], ""),
            "source_quote": r["source_quote"],
        })
    return villains[:MAX_VILLAINS]
