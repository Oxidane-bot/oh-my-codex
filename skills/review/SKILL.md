---
name: review
description: Reviewer-only pass for /plan --review and cleanup artifact review
---
<skill>
<identity>
Review is a reviewer-only compatibility alias over `/plan --review`.
It preserves the older review-oriented entry point while routing plan review through the canonical `plan` skill and maintaining author/reviewer separation.
</identity>

<when_to_use>
- Use when the user wants a plan or cleanup artifact critiqued rather than executed
- Use when an existing `.omx/plans/*.md` artifact needs Critic review
- Use when review must be kept separate from the authoring context
</when_to_use>

<workflow>
<compatibility_contract>
- `review` is not a separate planning system.
- It forwards to the canonical `plan --review` behavior.
- Preserve concise verdicts, concrete improvement requests, and reviewer-only separation.
</compatibility_contract>

<invocation>
```bash
/plan --review <arguments>
```
</invocation>

<review_flow>
1. Treat review as a reviewer-only pass. The authoring context may write the plan or cleanup proposal, but a separate reviewer context must issue the verdict.
2. Read the plan file from `.omx/plans/` or the explicitly provided path.
3. Evaluate it via the Critic review flow.
4. For cleanup/refactor/anti-slop work, confirm the artifact includes a cleanup plan, regression-test coverage or an explicit test gap, bounded smell-by-smell passes, and quality gates.
5. Return a grounded verdict: APPROVED, REVISE, or REJECT.
</review_flow>

<guardrails>
- Never write and approve in the same context.
- If the current context authored the artifact, hand review to Critic or another reviewer role.
- Approval must cite concrete evidence, not author claims.
</guardrails>
</workflow>
</skill>
