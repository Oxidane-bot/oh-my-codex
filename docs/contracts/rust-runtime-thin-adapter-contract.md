# Rust Runtime Thin-Adapter Contract

## Canonical ownership

Rust core is the single semantic owner for:

- authority
- lifecycle/session state
- dispatch/backlog
- replay/recovery
- readiness/diagnostics
- canonical mux operations

JS, HUD, CLI, and tmux are thin delivery/observer adapters. They may read
compatibility artifacts, but they MUST NOT define or mutate semantic truth on
their own.

## Compatibility artifacts

Legacy readers continue to read the same state files, but only as
Rust-authored compatibility views.

| Reader | Compatibility files | Compatibility guarantee |
|---|---|---|
| `omx team status` | `.omx/state/team/<team>/config.json`, `manifest.v2.json`, `tasks/*.json`, `approvals/*.json`, `workers/*` | Manifest-backed team config is authoritative when both config and manifest exist. |
| `omx doctor --team` | `.omx/state/team/<team>/config.json`, `manifest.v2.json`, `workers/*/status.json`, `workers/*/heartbeat.json`, `.omx/state/hud-state.json` | Manifest-backed tmux/session identity is authoritative when both config and manifest exist. |
| HUD readers | `.omx/state/session.json`, `.omx/state/sessions/<session>/team-state.json`, `.omx/state/team-state.json`, `.omx/state/ralph-state.json` | Session-scoped files are authoritative when a session is active; root files are compatibility fallback only. |

## Thin-adapter rules

1. Compatibility readers must ignore unknown fields and preserve their current
   JSON envelopes.
2. Legacy tmux typing is delivery only; it does not establish semantic truth.
3. If Rust-authored compatibility files and legacy JS defaults disagree, the
   Rust-authored file wins.
4. Unknown delivery failures are surfaced as adapter failures, not as semantic
   owner changes.

## Consumer matrix

| Consumer | Responsibility |
|---|---|
| Team CLI | Read Rust-authored compatibility artifacts and render them faithfully. |
| Doctor CLI | Report readiness from Rust-authored compatibility artifacts, then layer adapter health checks on top. |
| HUD | Stay read-only and scope-aware. |
| Notify/watchers | Deliver events; never become the semantic owner of the run. |
