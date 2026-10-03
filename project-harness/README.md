# DYAI Studio Project GPT Harness

**Harness level:** L3 — external truth.

This harness turns the ChatGPT Project into an orchestrator over live project truth rather than a self-contained memory system.

## Four layers
1. **Custom GPT identity** — `CUSTOM_GPT_SYSTEMPROMPT.md`
2. **ChatGPT Project workspace** — `GPT_PROJECT_INSTRUCTIONS.md` plus dynamic context files
3. **Knowledge pack** — operating contract, governance, evals and templates
4. **External truth** — Confluence DYAIStudio, Jira DYAI board 733 and GitHub DYAI2025/DYAI-Studio

## Install/use
- Use `CUSTOM_GPT_SYSTEMPROMPT.md` as the Custom GPT system prompt/instructions.
- Use `GPT_PROJECT_INSTRUCTIONS.md` as project-scoped instructions.
- Add only the static high-value files identified in `GPT_KNOWLEDGE_MANIFEST.md` to static GPT Knowledge.
- Keep project-state, decision logs and run/evidence ledgers in the Project/repo and refresh from live systems when material decisions depend on them.

## Limitation
This architecture is loss-minimised, not provably lossless. Chat context can become stale. Durable truth therefore lives outside the model.

## Validation
Run `scripts/validate_harness_pack.py` against this directory to check required files and the 8,000-character system-prompt limit.
