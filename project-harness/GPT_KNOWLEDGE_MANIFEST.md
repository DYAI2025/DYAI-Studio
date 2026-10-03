# GPT Knowledge Manifest

Keep static knowledge small. Dynamic state belongs in Project files and external systems.

| Priority | File / Source | Purpose | Static / dynamic | GPT Knowledge? |
|---:|---|---|---|---|
| 1 | CUSTOM_GPT_SYSTEMPROMPT.md | identity and invariant behaviour | static | system prompt |
| 2 | GPT_PROJECT_INSTRUCTIONS.md | project-scoped operating behaviour | semi-static | project instructions |
| 3 | PROJECT_OPERATING_CONTRACT.md | source-of-truth and delivery contract | static | yes |
| 4 | GOVERNANCE.yaml | machine-readable governance | static | yes |
| 5 | Confluence: 01 Product Vision & Business Model | canonical product intent | dynamic controlled | reference/link, not copied blindly |
| 6 | Confluence: 02 Target Audiences | ICP and jobs | dynamic controlled | reference/link |
| 7 | Confluence: 03 Offer & Solution Architecture | offer model | dynamic controlled | reference/link |
| 8 | Confluence: 04 Website Product Requirements | experience/product requirements | dynamic controlled | reference/link |
| 9 | Confluence: 05 IA & Bilingual Content Model | information/content architecture | dynamic controlled | reference/link |
| 10 | Confluence: 06 KPI Framework | measurement model | dynamic controlled | reference/link |
| 11 | Confluence: 07 Delivery Governance | Kanban, DoR/DoD, gates | dynamic controlled | reference/link |
| 12 | Confluence: 08 Evidence & Trust | evidence/case framework | dynamic controlled | reference/link |
| 13 | Confluence: 09 Risks & Decisions | assumptions and decisions | dynamic controlled | reference/link |
| 14 | EVAL_SCENARIOS.md | behavioural regression tests | static/semi-static | yes |
| 15 | docs/context/project-state.md | session continuity | dynamic | Project file / repo |
| 16 | docs/context/decision-log.md | local decision index | dynamic | Project file / repo |
| 17 | docs/context/run-ledger.jsonl | execution ledger | dynamic | external truth only |
| 18 | docs/reality/_template.evidence.jsonl | evidence contract | static template | yes |
| 19 | docs/governance/true-line-gate-check.template.md | claim/release gate | static template | yes |
| 20 | docs/governance/contradiction-ledger.template.md | drift/conflict tracking | static template | yes |

## Rule
Do not upload dynamic snapshots to GPT Knowledge and then treat them as current. Always prefer live Confluence/Jira/GitHub reads when current state matters.
