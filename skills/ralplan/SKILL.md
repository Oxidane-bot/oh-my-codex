---
name: ralplan
description: Alias for $plan --consensus
---
<skill>
<identity>
Ralplan is the canonical consensus-planning entry point.
It is a compatibility-friendly alias over `$plan --consensus`, preserving the branded RALPLAN-DR workflow while keeping planning behavior centralized under `plan`.
</identity>

<when_to_use>
- Use when the user wants consensus planning before execution
- Use when architecture, tradeoffs, or risky migrations need Planner + Architect + Critic alignment
- Use when a deep-interview spec exists and should be refined into an execution-ready plan
</when_to_use>

<flags>
- `--interactive`: pause at review/approval checkpoints for user input
- `--deliberate`: force higher-rigor planning with pre-mortem and expanded test planning for high-risk work
</flags>

<workflow>
<gpt54_guidance>
- Default to concise, evidence-dense progress and completion reporting unless the user or risk level requires more detail.
- Treat newer user task updates as local overrides for the active workflow branch while preserving earlier non-conflicting constraints.
- If correctness depends on additional inspection, retrieval, execution, or verification, keep using the relevant tools until the consensus-planning flow is grounded.
- Continue through clear, low-risk, reversible next steps automatically; ask only when the next step is materially branching, destructive, or preference-dependent.
</gpt54_guidance>

<compatibility_contract>
- `ralplan` remains a first-class branded workflow shell even though it delegates to the canonical `plan` skill in consensus mode.
- Preserve the distinct RALPLAN-DR framing: principles, drivers, options, architect challenge, and critic gate.
- Never implement directly from ralplan; execution handoff remains downstream to `ralph` or `team`.
</compatibility_contract>

<invocation>
This skill invokes the Plan skill in consensus mode:

```bash
$plan --consensus <arguments>
$plan --consensus --interactive <arguments>
$plan --consensus --deliberate <arguments>
```
</invocation>

<consensus_flow>
1. **Planner** drafts the plan and emits a compact RALPLAN-DR summary.
2. **User feedback** happens only in `--interactive` mode.
3. **Architect** reviews the plan and must provide a steelman antithesis plus tradeoff tension.
4. **Critic** evaluates principle-option consistency, risks, and verification quality.
5. **Re-review loop** repeats until approval or iteration cap.
6. **Execution handoff** routes to `ralph` or `team` only after approval.

> **Important:** Architect and Critic must run sequentially, never in the same parallel batch.
</consensus_flow>

<pre_context_gate>
## Pre-context Intake

Before consensus planning or execution handoff, ensure a grounded context snapshot exists under `.omx/context/`.
- Reuse the latest relevant snapshot in `.omx/context/{slug}-*.md` when available.
- If none exists, create `.omx/context/{slug}-{timestamp}.md` (UTC `YYYYMMDDTHHMMSSZ`) with task statement, desired outcome, known facts/evidence, constraints, unknowns/open questions, and likely codebase touchpoints.
If ambiguity remains high, run `explore` and then `$deep-interview --quick <task>` before continuing.
</pre_context_gate>

<ralplan_first_gate>
Execution modes such as `ralph`, `autopilot`, `team`, and `ultrawork` should not launch on underspecified work when the ralplan gate applies.
Ralplan exists to turn vague execution requests into explicit, testable plans before heavy orchestration starts.
</ralplan_first_gate>

<pre_execution_gate>
## Pre-Execution Gate

Execution modes (`ralph`, `autopilot`, `team`, `ultrawork`) should not launch on underspecified work when the ralplan gate applies.

Bypass prefixes are supported when the user explicitly wants to override the gate:
- `force:`
- `! `

The final approved plan must include ADR fields: **Decision**, **Drivers**, **Alternatives considered**, **Why chosen**, **Consequences**, and **Follow-ups**.

Important: steps 3 and 4 MUST run sequentially. Do NOT run Architect and Critic in parallel; always await completion before step 4.
</pre_execution_gate>
</workflow>

<style>
<output_contract>
Default final-output shape: concise and evidence-dense unless the user asks for more detail.

- Plan path
- RALPLAN-DR summary
- Approval/review status
- Next-step handoff (`$ralph` / `$team`) when appropriate
</output_contract>

<scenario_examples>
**Good:** The user says `continue` after the next safe planning step is already known. Continue the current branch of work instead of restarting discovery.

**Good:** The user changes only the output shape or downstream delivery step (for example `make a PR`). Preserve earlier non-conflicting workflow constraints and apply the update locally.

**Bad:** The user says `continue`, and the workflow restarts discovery or stops before the missing verification/evidence is gathered.
</scenario_examples>
</style>
</skill>
