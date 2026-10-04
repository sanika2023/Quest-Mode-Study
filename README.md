# Quest-Mode Study

Turn your study notes into a fantasy campaign. Each pomodoro is a chapter, each break is a choice between rest and a review challenge, and every concept you miss comes back as a villain in the next chapter.

Built solo at **Hack Dearborn 2026** (Mindscapes track).

## Why

I study with the pomodoro technique, and two things kept going wrong: the breaks turned into doom-scrolling, and I re-read notes instead of actually testing myself. Quest-Mode Study keeps the pomodoro rhythm but makes the break count. You either rest properly (box breathing or a timed free break) or face a character who checks what you just learned, and the grading is tied to your own notes.

## How it works

1. **Add your notes.** Paste text, upload a PDF, or just type a topic. Pick a session length.
2. **Get a campaign.** Gemini turns the material into chapters, one per pomodoro, each with a story beat and quest objectives (the key concepts).
3. **Focus.** A pomodoro timer runs with optional brown noise. The screen shows only the objectives, not the answers, so the review stays real recall practice.
4. **Choose your break.**
   - **Fun break:** follow the Breathing Sigil (4-4-4-4 box breathing), or take free time with just the timer.
   - **Review break:** face one of two characters.
     - **Elder Orin** quizzes you with three questions from the chapter. You can skip a question.
     - **Pip, the Confused Apprentice**, confidently states a wrong claim from the chapter. You teach Pip the correct idea.
5. **See the verdict.** Each concept is marked correct, partial, missed, or wrong, with the matching quote from your notes as proof.
6. **Face your villains.** Missed and wrong concepts return as villains in the next chapter, shown on the roadmap and the focus screen.

## Grounded in your notes

Model output is checked before you see it:

- Every quote shown as evidence must pass `citation_check`, plain Python with no model involved, which confirms the quote appears in your notes (ignoring case, whitespace, and curly quotes). Unverified quotes are never displayed as evidence.
- Pip's wrong claim and its correction come from the generated campaign, which is checked against your notes. The character is instructed never to invent new wrong claims.
- Grading sees only the transcript and the chapter data, and each quiz verdict is tied to the question that was actually asked.
- All Gemini calls use structured JSON output with a retry and a fallback model.

### Eval

`backend/eval/run_eval.py` generates campaigns from three sets of student-style notes (cell biology, World War I, databases) and checks the raw model output, before any filtering. The latest run ([report](backend/eval/results/report.md)):

- **Citation pass rate: 100% (84/84 quotes)**, including all 36 quiz questions, on clean typed notes.
- **Grading agreement: 100% (35/35)** on scripted answers with known verdicts: the reference answer (correct), "I don't know" (missed), and an answer to a different question (wrong). These are clear-cut cases; nuanced partial answers are not measured yet.

Run it from `backend/` with `.\.venv\Scripts\python.exe eval\run_eval.py` (makes real Gemini calls, writes nothing to the database).

## Demo tips

- **Demo mode** (toggle on the roadmap) shortens focus to 20 seconds and breaks to 15 seconds.
- **Demo breaks** (link on the roadmap) jumps straight to the break choice in practice mode. Reviews are still graded for real, but nothing is saved and the chapter is not marked done.
- Reloading the page never calls the model. Campaigns are read from the database.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Backend | Python, Flask |
| Database | Tiger Data (PostgreSQL), plain SQL via psycopg 3 |
| AI | Google Gemini via `google-genai` (`gemini-3.8-flash`, fallback `gemini-3.5-flash-lite`) |
| Audio | Web Audio API (brown noise generated in the browser) |
| Tests | pytest (backend, Gemini faked), Vitest (frontend logic) |

The full design (API contracts, schema, data flow) is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run it locally

You need Python 3 (developed on 3.14), Node 20+, a PostgreSQL database (I used Tiger Data), and a Gemini API key.

**1. Configure secrets.** Copy `.env.example` to `backend/.env` and fill in `GEMINI_API_KEY` and `DATABASE_URL`. The ElevenLabs variables can stay empty. `backend/.env` is gitignored.

**2. Backend** (from `backend/`):

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts\apply_schema.py    # creates the tables; safe to re-run
.\dev.ps1                                             # Flask on http://localhost:5000
```

On macOS or Linux, run `source .venv/bin/activate`, then `python scripts/apply_schema.py` and `python -m flask --app app run --debug --port 5000`.

**3. Frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The dev server proxies `/api` to Flask.

### Tests

```powershell
cd backend;  .\.venv\Scripts\python.exe -m pytest -q   # database tests skip if DATABASE_URL is unset
cd frontend; npm test
```

## Project layout

```text
backend/
  app.py              Flask app factory
  routes/             campaigns, review, grading
  services/           gemini_client, campaign_service, review_service, grading_service, citation_check, pdf_text
  prompts/            every Gemini prompt, as a file
  scripts/            apply_schema, smoke_test
  tests/
frontend/
  src/screens/        Notes, Roadmap, Focus, BreakChoice, Review, Results
  src/breaks/         FunBreak, BoxBreathing
  src/review/         TextReview (review provider)
  src/lib/            timer, settings, brown noise, breathing logic
  public/characters/  Orin and Pip portraits
docs/ARCHITECTURE.md
```

## Status and roadmap

Working end to end: notes to campaign, pomodoro timer with brown noise, fun and review breaks, cited grading, and villains carried into the next chapter.

Done: the eval (citation pass rate and grading agreement), with results in the [Eval](#eval) section above.

Planned:

- **Voice review with ElevenLabs.** Talk to Orin and Pip instead of typing. The review already runs behind a provider interface, so voice will be a second provider next to `TextReview`.
- Narrated chapter intros, a doodle pad for fun breaks, a progress chart, and deployment.

## Credits

Character art for Elder Orin and Pip was generated with Google Gemini. Fonts: Cinzel and Inter from Google Fonts.
