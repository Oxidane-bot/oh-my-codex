# oh-my-codex v0.11.9

**Patch release for deeper deep-interview / ralplan coordination, setup repair, and safer live team supervision**

`0.11.9` follows `0.11.8` with a focused patch train that hardens deep-interview behavior, makes live ralplan progress observable, and cleans up setup / HUD / routing polish around active maintainer workflows.

## Highlights

- Deep-interview lock state now suppresses tmux-pane nudges, and the planning handoff keeps stronger deep-interview pressure before execution.
- Live ralplan consensus planning now exposes observable runtime state for downstream HUD / pipeline visibility.
- Setup no longer rebreaks Codex-managed TUI configs, active stateful modes stay visible in the HUD, and live worker supervision remains alive while workers are still active.

## What’s Changed

### Fixes
- suppress fallback tmux-pane nudges while deep-interview lock state is active
- strengthen deep-interview pressure before planning handoff
- keep setup compatible with Codex-managed TUI configs and align default explore-routing guidance with setup adoption
- restore HUD visibility for active stateful modes
- keep fallback orchestration alive while live team workers still need supervision
- auto-accept the Claude bypass prompt in team flows when required

### Changed
- expose observable ralplan runtime state during live consensus planning
- refresh the analyze skill around OmC trace methodology and execution-policy contract wording
- bump release metadata from `0.11.8` to `0.11.9` across the Node and Cargo packages
- refresh maintenance baselines with `c8@11.0.0`, `@types/node@25.5.0`, and the README Star History chart

## Verification

- `npm run build`
- `npm run lint`
- `npm run check:no-unused`
- `node --test --test-reporter=spec dist/cli/__tests__/version-sync-contract.test.js`
- `node --test --test-reporter=spec dist/cli/__tests__/setup-refresh.test.js dist/cli/__tests__/setup-scope.test.js dist/cli/__tests__/doctor-warning-copy.test.js`
- `node --test --test-reporter=spec dist/hooks/__tests__/explore-routing.test.js dist/hooks/__tests__/explore-sparkshell-guidance-contract.test.js dist/hooks/__tests__/deep-interview-contract.test.js dist/hooks/__tests__/notify-fallback-watcher.test.js dist/hooks/__tests__/notify-hook-auto-nudge.test.js dist/hooks/__tests__/agents-overlay.test.js`
- `node --test --test-reporter=spec dist/hud/__tests__/index.test.js dist/hud/__tests__/render.test.js dist/hud/__tests__/state.test.js`
- `node --test --test-reporter=spec dist/pipeline/__tests__/stages.test.js dist/ralplan/__tests__/runtime.test.js`

## Remaining risk

- Verification is intentionally targeted to the release-window behavior touched after `v0.11.8`; it is not a rerun of the full repository test matrix.
- The deep-interview nudge suppression contract still depends on future nudge entrypoints preserving the same lock-state check.
- Live ralplan observability now feeds more surfaces, so future HUD / pipeline readers should preserve the same runtime field names.

## Contributors

- [@Yeachan-Heo](https://github.com/Yeachan-Heo) (Bellman)
- [@HaD0Yun](https://github.com/HaD0Yun)
- [@ToaruPen](https://github.com/ToaruPen)

**Full Changelog**: [`v0.11.8...v0.11.9`](https://github.com/Yeachan-Heo/oh-my-codex/compare/v0.11.8...v0.11.9)
