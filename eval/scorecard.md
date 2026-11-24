# Synoptik evidence scorecard

Generated: 2026-11-24T18:09:56.192Z
Corpus: demo

| Metric | Value |
| --- | --- |
| Answerable correct | 83/87 (95.4%) |
| Wrong answers | 1 (1.2% of answered) |
| Correct refusals | 23/23 (100.0%) |
| Overall accuracy | 96.4% |

| Set | Answered-correct | Wrong | Missed | Refusals | p95 |
| --- | --- | --- | --- | --- | --- |
| demo-curated | 95.5% | 0 | 3 | 100.0% | 3.74 ms |
| demo-paraphrase | 95.2% | 1 | 0 | 100.0% | 3.62 ms |

## Failures

| Set | Question | Outcome | Reason |
| --- | --- | --- | --- |
| demo-curated | What is the difference between TerraShield X5 and SilkWall Interior Matt? | missed | comparison |
| demo-curated | В чём разница между TerraShield X5 и SilkWall Interior Matt? | missed | comparison |
| demo-curated | TerraShield X5 мен SilkWall Interior Matt арасындағы айырмашылық қандай? | missed | comparison |
| demo-paraphrase | Which primer goes under the facade paint? | wrong-answer | missing expected value |
