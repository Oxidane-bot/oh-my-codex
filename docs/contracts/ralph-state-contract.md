# Ralph State Contract (Frozen)

## Canonical Ralph state schema

Ralph runtime state is stored at `.omx/state/{scope}/ralph-state.json` and MUST use this schema:

- `active: boolean` **(required)**
- `iteration: number` **(required while active)**
- `max_iterations: number` **(required while active)**
- `current_phase: string` **(required while active)**
- `started_at: ISO8601 string` **(required while active)**
- `completed_at?: ISO8601 string`
- Optional linkage fields: `linked_ultrawork`, `linked_ecomode`, `linked_mode`
- Optional ownership fields:
  - `owner_omx_session_id`
  - `owner_codex_session_id`
  - `owner_codex_thread_id`
- Optional tmux anchor fields:
  - `tmux_pane_id`
  - `tmux_pane_set_at`
  - `tmux_session_name`
- Optional migration/audit fields:
  - `resumed_from_omx_session_id`
  - `resumed_at`
  - `stop_reason`
  - `transferred_to_session_id`
  - `transferred_at`

Ralph remains a standalone mode. Other workflows may start Ralph later as an
explicit follow-up, but there is no built-in `omx team ralph ...` linked launch
path anymore.

Legacy phase aliases may be normalized for compatibility, but persisted values MUST end in the frozen enum below.

## Frozen Ralph phase vocabulary

`current_phase` for Ralph MUST be one of:

- `starting`
- `executing`
- `verifying`
- `fixing`
- `complete`
- `failed`
- `cancelled`

Unknown phase values MUST be rejected.

Phase progression reference (illustrative):
starting
- `executing`
- `verifying`
- `fixing`
- `complete`

## Frozen scope policy

1. If `session_id` is present (explicit argument or current `.omx/state/session.json`), session scope (`.omx/state/sessions/{session_id}/...`) is authoritative.
2. Root scope (`.omx/state/*.json`) is compatibility fallback only.
3. Writes MUST target one scope (authoritative scope), never broadcast to unrelated sessions.
4. Same-Codex-session continuation MAY migrate a single active Ralph from one session scope into the current authoritative session scope when:
   - the source Ralph is still active and non-terminal,
   - `owner_codex_session_id` matches the live Codex payload `session_id`,
   - the current authoritative session does not already own a Ralph state.
5. Migration MUST preserve single-owner semantics:
   - the destination session becomes authoritative,
   - the source session is immediately deactivated with audit fields describing the transfer,
   - unrelated sessions MUST remain untouched.

## Consumer compatibility matrix

| Consumer | Responsibility under frozen scope/phase contract |
|---|---|
| `src/hud/state.ts` | Read session scope first when current session is known; fall back to root only when scoped file is absent. |
| `src/mcp/trace-server.ts` | Build mode timeline from authoritative scope paths resolved via state-path helpers. |
| `scripts/notify-hook.js` | Update lifecycle counters only in the authoritative session scope (or root fallback), never all sessions. |
| `scripts/notify-hook.js` | Same-Codex-session auto-resume is implemented as a single-owner migration into the current authoritative session scope, never as cross-session multi-owner fallback. |
| `src/hooks/agents-overlay.ts` | Summarize active modes from scope-preferred mode files (session overrides root). |
| `src/cli/index.ts` (`status`/`cancel`) | Status and cancellation operate on scope-preferred mode files; cancellation does not mutate unrelated sessions. |

## Canonical PRD/progress sources

- Canonical PRD: `.omx/plans/prd-{slug}.md`
- Canonical progress ledger: `.omx/state/{scope}/ralph-progress.json`
- Legacy compatibility migration:
  - `.omx/prd.json` migrates one-way to canonical PRD markdown when no canonical PRD exists.
  - `.omx/progress.txt` migrates one-way to canonical `ralph-progress.json` when no canonical ledger exists.
  - Legacy files remain read-only compatibility artifacts for one release cycle.
