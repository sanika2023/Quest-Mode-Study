from eval import run_eval

NOTES = "Mitochondria make ATP. Ribosomes build proteins. The nucleus holds DNA."


def q(question, answer, quote):
    return {"question": question, "answer": answer, "source_quote": quote}


CAMPAIGN = {
    "chapters": [
        {
            "concepts": [
                {"name": "ATP", "explanation": "", "source_quote": "Mitochondria make ATP."},
                {"name": "Made up", "explanation": "", "source_quote": "Cells are tiny planets."},
            ],
            "quiz": [q("What makes ATP?", "Mitochondria", "mitochondria  make ATP.")],
            "misconception": {"wrong_claim": "x", "correction": "y", "source_quote": "The nucleus holds DNA."},
        },
        {
            "concepts": [{"name": "Ribosomes", "explanation": "", "source_quote": "Ribosomes build proteins."}],
            "quiz": [q("What builds proteins?", "Ribosomes", "Ribosomes make proteins.")],
            "misconception": {"wrong_claim": "x", "correction": "y", "source_quote": ""},
        },
    ]
}


def test_quote_stats_counts_passes_per_kind():
    stats = run_eval.quote_stats(CAMPAIGN, NOTES)
    assert stats["concepts"] == {"passed": 2, "total": 3}
    assert stats["quiz"] == {"passed": 1, "total": 2}
    assert stats["misconception"] == {"passed": 1, "total": 2}
    assert stats["all"] == {"passed": 4, "total": 7}


def test_quote_stats_lists_failures():
    failures = run_eval.quote_stats(CAMPAIGN, NOTES)["failures"]
    assert ("concepts", "Cells are tiny planets.") in failures
    assert ("quiz", "Ribosomes make proteins.") in failures
    assert len(failures) == 3


def test_scripted_transcript_rotates_answer_styles():
    chapter = {"quiz": [q("Q1", "A1", "s1"), q("Q2", "A2", "s2"), q("Q3", "A3", "s3"), q("Q4", "A4", "s4")]}
    transcript, expected = run_eval.scripted_transcript(chapter, wrong_answers=["W1", "W2", "W3"], offset=1)
    assert transcript == [
        {"role": "character", "text": "Q1"}, {"role": "student", "text": run_eval.DONT_KNOW},
        {"role": "character", "text": "Q2"}, {"role": "student", "text": "W2"},
        {"role": "character", "text": "Q3"}, {"role": "student", "text": "A3"},
    ]
    assert expected == {"s1": "missed", "s2": "wrong", "s3": "correct"}


def test_agreement_matches_results_by_quote():
    expected = {"s1": "correct", "s2": "missed", "s3": "wrong"}
    results = [
        {"source_quote": "s1", "verdict": "correct"},
        {"source_quote": "s2", "verdict": "wrong"},
        {"source_quote": "s3", "verdict": "wrong"},
    ]
    rows = run_eval.agreement(expected, results)
    assert [r["match"] for r in rows] == [True, False, True]
    assert rows[1] == {"source_quote": "s2", "expected": "missed", "verdict": "wrong", "match": False}


def test_agreement_counts_dropped_results_as_mismatches():
    rows = run_eval.agreement({"s1": "correct", "s2": "missed"}, [{"source_quote": "s1", "verdict": "correct"}])
    assert rows[1] == {"source_quote": "s2", "expected": "missed", "verdict": None, "match": False}


def test_rate_formats_percent():
    assert run_eval.rate({"passed": 3, "total": 4}) == "75.0% (3/4)"
    assert run_eval.rate({"passed": 0, "total": 0}) == "n/a (0/0)"
