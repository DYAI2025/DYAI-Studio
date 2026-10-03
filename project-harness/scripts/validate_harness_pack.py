#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "README.md",
    "CUSTOM_GPT_SYSTEMPROMPT.md",
    "GPT_PROJECT_INSTRUCTIONS.md",
    "GPT_KNOWLEDGE_MANIFEST.md",
    "PROJECT_OPERATING_CONTRACT.md",
    "GOVERNANCE.yaml",
    "EVAL_SCENARIOS.md",
    "project-index.json",
    "docs/context/project-state.md",
    "docs/context/decision-log.md",
    "docs/context/run-ledger.jsonl",
    "docs/canvas/_template.canvas.md",
    "docs/vision/_template.vision.md",
    "docs/prd/_template.prd.md",
    "docs/traceability/_template.traceability.md",
    "docs/reality/_template.evidence.jsonl",
    "docs/governance/true-line-gate-check.template.md",
    "docs/governance/contradiction-ledger.template.md",
    "docs/reviews/honest-status.template.md",
    "schemas/evidence-entry.schema.json",
    "schemas/traceability-row.schema.json",
]

errors = []
for rel in REQUIRED:
    if not (ROOT / rel).is_file():
        errors.append(f"missing: {rel}")

prompt = ROOT / "CUSTOM_GPT_SYSTEMPROMPT.md"
if prompt.is_file():
    length = len(prompt.read_text(encoding="utf-8"))
    print(f"system_prompt_chars={length}")
    if length > 8000:
        errors.append(f"system prompt over 8000 chars: {length}")

if errors:
    for e in errors:
        print(e, file=sys.stderr)
    sys.exit(1)

print(f"required_files={len(REQUIRED)}")
print("harness_validation=PASS")
