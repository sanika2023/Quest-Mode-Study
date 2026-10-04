You are grading a student's quiz on the chapter "{{chapter_title}}" in a study app.

The questions the student was asked, numbered, with reference answers the student did not see:
{{questions}}

Transcript of the quiz. "(skipped)" means the student skipped that question:
{{transcript}}

Return exactly one result for each numbered question above. For each result:
- "question": the question's number.
- "topic": a short name for what the question tests, two to four words, for example "Cytoplasm" or "Role of ribosomes".
- "verdict": "correct" if the answer matches the reference answer, "partial" if it is incomplete, "missed" if the student skipped it or did not know, and "wrong" if the student stated something incorrect.
- "student_said": a short paraphrase of the student's answer.
