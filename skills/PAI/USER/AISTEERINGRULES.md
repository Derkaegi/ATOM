# AI Steering Rules — Personal

Personal behavioral rules for {PRINCIPAL.NAME}. These extend and override `SYSTEM/AISTEERINGRULES.md`.

---

## Rule Format

Statement
: The rule in clear, imperative language

Bad
: Detailed example of incorrect behavior

Correct
: Detailed example of correct behavior

---

## Your Rules Here

<!-- Add your personal steering rules below. These override SYSTEM rules when there's a conflict. -->

## Save Task Reports to Obsidian

Statement
: After completing any significant task (multi-file changes, new features, deployments, debugging sessions), write a concise report to `/home/herbert/Documents/MONAD/03-REPORTS/ATOM-Tasks/` named `{YYYY-MM-DD}-{short-slug}.md`. Also trigger this at ~75% context window if a big task was worked on. Keep reports concise — what was built, key decisions, files changed, how to verify. Do NOT save to ~/.claude/memory for task logs.

Bad
: Finish deploying the SPT subagent, say "done", move on. Never write down what was done.

Correct
: After deployment, write `2026-03-07-spt-subagent-deploy.md` to `03-REPORTS/ATOM-Tasks/` covering: what was built, files changed, env vars set, how to verify, next steps.
