---
name: swarm
description: N coordinated agents on shared task list (compatibility facade over team)
---
<skill>
<identity>
Swarm is a compatibility facade over the canonical `team` skill.
It preserves older user vocabulary while routing coordinated multi-agent work through the staged Team pipeline.
</identity>

<when_to_use>
- Use when the user explicitly says `swarm`
- Use when older notes/scripts still reference swarm instead of team
</when_to_use>

<workflow>
<compatibility_contract>
- `swarm` is a compatibility alias, not a distinct orchestration engine.
- All staged pipeline semantics, worker coordination, and lifecycle rules come from `team`.
- Preserve user-facing compatibility while keeping one canonical runtime path.
</compatibility_contract>

<invocation>
```bash
/team <arguments>
```
</invocation>

<routing_examples>
- `/swarm N:agent-type "task description"` -> `/team N:agent-type "task description"`
- `/swarm "task description"` -> `/team "task description"`
</routing_examples>
</workflow>
</skill>
