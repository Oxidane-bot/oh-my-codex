import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, mkdir, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startMode } from '../base.js';

describe('modes/base tmux pane capture', () => {
  it('captures tmux_pane_id in mode state on startMode()', async () => {
    const prev = process.env.TMUX_PANE;
    const prevPath = process.env.PATH;
    process.env.TMUX_PANE = '%123';
    const wd = await mkdtemp(join(tmpdir(), 'omx-mode-pane-'));
    try {
      const fakeBinDir = join(wd, 'fake-bin');
      await mkdir(fakeBinDir, { recursive: true });
      await writeFile(join(fakeBinDir, 'tmux'), `#!/usr/bin/env bash
set -eu
if [[ "$1" == "display-message" && "$5" == "#S" ]]; then
  echo "devsess"
  exit 0
fi
exit 1
`);
      await chmod(join(fakeBinDir, 'tmux'), 0o755);
      process.env.PATH = `${fakeBinDir}:${prevPath || ''}`;
      await startMode('ralph', 'test', 1, wd);
      const raw = JSON.parse(await readFile(join(wd, '.omx', 'state', 'ralph-state.json'), 'utf-8'));
      assert.equal(raw.tmux_pane_id, '%123');
      assert.equal(raw.tmux_session_name, 'devsess');
      assert.ok(typeof raw.tmux_pane_set_at === 'string' && raw.tmux_pane_set_at.length > 0);
    } finally {
      if (typeof prev === 'string') process.env.TMUX_PANE = prev;
      else delete process.env.TMUX_PANE;
      if (typeof prevPath === 'string') process.env.PATH = prevPath;
      else delete process.env.PATH;
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('blocks exclusive mode startup when another exclusive state file is malformed', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omx-mode-malformed-'));
    try {
      const stateDir = join(wd, '.omx', 'state');
      await mkdir(stateDir, { recursive: true });
      await writeFile(join(stateDir, 'ralph-state.json'), '{ "active": true');

      await assert.rejects(
        () => startMode('autopilot', 'test', 1, wd),
        /state file is malformed or unreadable/i,
      );
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
