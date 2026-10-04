# Eval report

Sample notes: cell_biology.txt, intro_databases.txt, world_war_one.txt. Model: campaign and grading via `gemini_client`.

## Citation pass rate (raw model output, before filtering)

| Kind | Pass rate |
| --- | --- |
| concepts | 100.0% (36/36) |
| quiz | 100.0% (36/36) |
| misconception | 100.0% (12/12) |
| all | 100.0% (84/84) |

## Grading agreement (scripted answers with known verdicts)

Overall: 100.0% (35/35)

| Expected | Agreement |
| --- | --- |
| correct | 100.0% (12/12) |
| missed | 100.0% (11/11) |
| wrong | 100.0% (12/12) |

## 20 sample verdicts for manual review

| Notes | Question | Answer given | Expected | Verdict |
| --- | --- | --- | --- | --- |
| cell_biology.txt | Who established in 1855 that all cells come from pre-existing cells? | Virchow. | correct | correct |
| cell_biology.txt | Which organisms are classified as prokaryotes? | I don't know. | missed | missed |
| cell_biology.txt | How much larger are eukaryotic cells usually compared to prokaryotic cells? | They have their own DNA. | wrong | wrong |
| cell_biology.txt | What organelle synthesizes lipids and neutralizes drugs and poisons? | I don't know. | missed | missed |
| cell_biology.txt | What organelle contains digestive enzymes to dismantle worn-out organelles and food? | Bacteria and archaea. | wrong | wrong |
| cell_biology.txt | What feature of mitochondria provides evidence supporting the endosymbiotic theory? | They have their own DNA. | correct | correct |
| cell_biology.txt | Why is the physical shape of animal cells more flexible than that of plant cells? | Virchow. | wrong | wrong |
| cell_biology.txt | What structures in animal cells assist in organizing cell division? | Centrioles. | correct | correct |
| cell_biology.txt | What material comprises the rigid cell wall of a plant cell? | I don't know. | missed | missed |
| cell_biology.txt | Which molecules are able to diffuse directly through the phospholipid bilayer? | Small nonpolar molecules like O2 and CO2. | correct | correct |
| cell_biology.txt | How does diffusion move molecules without utilizing energy? | I don't know. | missed | missed |
| cell_biology.txt | What is the term for water diffusing across a membrane? | 10 to 100 times larger. | wrong | wrong |
| intro_databases.txt | What is another name for a table in a relational database? | Relation | correct | correct |
| intro_databases.txt | Can a primary key ever be NULL? | I don't know. | missed | missed |
| intro_databases.txt | What does referential integrity mean regarding foreign keys? | A LEFT JOIN | wrong | wrong |
| intro_databases.txt | Which SQL clause sorts the result in descending order when combined with DESC? | I don't know. | missed | missed |
| intro_databases.txt | What happens if you run an UPDATE or DELETE without a WHERE clause? | No | wrong | wrong |
| intro_databases.txt | Which join returns all rows from the left table and matching rows from the right table? | A LEFT JOIN | correct | correct |
| intro_databases.txt | What is the primary purpose of normalization? | Relation | wrong | wrong |
| intro_databases.txt | Why does denormalization make reads faster while impacting other operations? | At the cost of extra storage and harder updates | correct | correct |

## Failed quotes

None.
