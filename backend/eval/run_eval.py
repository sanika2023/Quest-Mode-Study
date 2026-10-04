"""Citation pass rate and grading agreement over sample notes. Run from backend/: python eval/run_eval.py
Makes real Gemini calls; never writes to the database."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services import campaign_service, gemini_client, grading_service, prompts
from services.citation_check import citation_check
from services.review_service import MAX_QUIZ_QUESTIONS

HERE = Path(__file__).parent
CHAPTERS = 4
KINDS = ("concepts", "quiz", "misconception")
STYLES = ("correct", "missed", "wrong")
DONT_KNOW = "I don't know."
SAMPLE_VERDICTS = 20


def _quotes(chapter, kind):
    items = chapter[kind] if kind != "misconception" else [chapter["misconception"]]
    return [i["source_quote"] for i in items if i]


def quote_stats(campaign, notes):
    """Pass counts per kind on raw model output, before any filtering."""
    stats = {k: {"passed": 0, "total": 0} for k in (*KINDS, "all")}
    failures = []
    for chapter in campaign["chapters"]:
        for kind in KINDS:
            for quote in _quotes(chapter, kind):
                ok = citation_check(quote, notes)
                for key in (kind, "all"):
                    stats[key]["total"] += 1
                    stats[key]["passed"] += ok
                if not ok:
                    failures.append((kind, quote))
    return {**stats, "failures": failures}


def scripted_transcript(chapter, wrong_answers, offset):
    """Answers each asked question in a rotating style; returns the transcript and expected verdict per quote."""
    transcript, expected = [], {}
    for i, q in enumerate(chapter["quiz"][:MAX_QUIZ_QUESTIONS]):
        style = STYLES[(i + offset) % len(STYLES)]
        answer = {"correct": q["answer"], "missed": DONT_KNOW, "wrong": wrong_answers[i % len(wrong_answers)]}[style]
        transcript += [{"role": "character", "text": q["question"]}, {"role": "student", "text": answer}]
        expected[q["source_quote"]] = style
    return transcript, expected


def agreement(expected, results):
    verdicts = {r["source_quote"]: r["verdict"] for r in results}
    return [
        {"source_quote": quote, "expected": want, "verdict": verdicts.get(quote), "match": verdicts.get(quote) == want}
        for quote, want in expected.items()
    ]


def rate(counts):
    p, t = counts["passed"], counts["total"]
    return f"{100 * p / t:.1f}% ({p}/{t})" if t else f"n/a ({p}/{t})"


def _run_notes(path):
    notes = path.read_text(encoding="utf-8")
    raw = gemini_client.generate_json(
        prompts.load("campaign.md", chapter_count=CHAPTERS, source=notes), schema=campaign_service.CAMPAIGN_SCHEMA
    )
    stats = quote_stats(raw, notes)
    print(f"{path.name}: {len(raw['chapters'])} chapters, quotes {rate(stats['all'])}")

    # Grade the filtered chapters, as the app would; wrong answers come from other chapters.
    chapters = [campaign_service._verified(c, notes) for c in raw["chapters"]]
    rows = []
    for n, chapter in enumerate(chapters):
        if not chapter["quiz"]:
            continue
        others = [q["answer"] for m, c in enumerate(chapters) if m != n for q in c["quiz"]] or ["The sun is cold."]
        transcript, expected = scripted_transcript(chapter, others, offset=n)
        try:
            results = grading_service.grade(chapter, "quiz", transcript, notes)
        except Exception as e:
            print(f"  grading failed for chapter {n + 1}, skipped: {e}")
            continue
        answers = {q["source_quote"]: t["text"] for q, t in zip(chapter["quiz"], transcript[1::2])}
        questions = {q["source_quote"]: q["question"] for q in chapter["quiz"]}
        for row in agreement(expected, results):
            rows.append({**row, "notes": path.name, "question": questions[row["source_quote"]], "answer": answers[row["source_quote"]]})
    return stats, rows


def _merge(all_stats):
    keys = (*KINDS, "all")
    total = {k: {"passed": sum(s[k]["passed"] for s in all_stats), "total": sum(s[k]["total"] for s in all_stats)} for k in keys}
    return {**total, "failures": [f for s in all_stats for f in s["failures"]]}


def _report(stats, rows):
    matched = {"passed": sum(r["match"] for r in rows), "total": len(rows)}
    lines = [
        "# Eval report",
        "",
        f"Sample notes: {', '.join(sorted({r['notes'] for r in rows}))}. Model: campaign and grading via `gemini_client`.",
        "",
        "## Citation pass rate (raw model output, before filtering)",
        "",
        "| Kind | Pass rate |",
        "| --- | --- |",
        *(f"| {k} | {rate(stats[k])} |" for k in (*KINDS, "all")),
        "",
        "## Grading agreement (scripted answers with known verdicts)",
        "",
        f"Overall: {rate(matched)}",
        "",
        "| Expected | Agreement |",
        "| --- | --- |",
    ]
    for style in STYLES:
        sub = [r for r in rows if r["expected"] == style]
        lines.append(f"| {style} | {rate({'passed': sum(r['match'] for r in sub), 'total': len(sub)})} |")
    lines += ["", f"## {SAMPLE_VERDICTS} sample verdicts for manual review", "",
              "| Notes | Question | Answer given | Expected | Verdict |", "| --- | --- | --- | --- | --- |"]
    for r in rows[:SAMPLE_VERDICTS]:
        cells = [r["notes"], r["question"], r["answer"], r["expected"], f"{r['verdict']}{'' if r['match'] else ' ✗'}"]
        lines.append("| " + " | ".join(c.replace("|", "/") for c in cells) + " |")
    failed = [f"- {kind}: \"{quote}\"" for kind, quote in stats["failures"]]
    lines += ["", "## Failed quotes", "", *(failed or ["None."])]
    return "\n".join(lines) + "\n", matched


def main():
    all_stats, rows = [], []
    for path in sorted((HERE / "sample_notes").glob("*.txt")):
        stats, file_rows = _run_notes(path)
        all_stats.append(stats)
        rows += file_rows
    stats = _merge(all_stats)
    report, matched = _report(stats, rows)
    out = HERE / "results" / "report.md"
    out.parent.mkdir(exist_ok=True)
    out.write_text(report, encoding="utf-8")
    print(f"\nCitation pass rate: {rate(stats['all'])} (quiz questions: {rate(stats['quiz'])})")
    print(f"Grading agreement: {rate(matched)}")
    print(f"Report: {out}")


if __name__ == "__main__":
    main()
