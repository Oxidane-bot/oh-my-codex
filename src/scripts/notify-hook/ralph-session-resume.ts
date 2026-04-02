import { existsSync } from 'fs';
import { mkdir, readFile, readdir, rename, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { captureTmuxPaneFromEnv, captureTmuxSessionNameFromPane } from '../../state/mode-state-context.js';
import { resolveCodexPane } from '../tmux-hook-engine.js';
import { safeString } from './utils.js';

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const RALPH_TERMINAL_PHASES = new Set(['complete', 'failed', 'cancelled']);

interface RalphSessionResumeParams {
  stateDir: string;
  payloadSessionId: string;
  payloadThreadId?: string;
  env?: NodeJS.ProcessEnv;
}

export interface RalphSessionResumeResult {
  currentOmxSessionId: string;
  resumed: boolean;
  updatedCurrentOwner: boolean;
  reason: string;
  sourcePath?: string;
  targetPath?: string;
}

interface RalphStateCandidate {
  sessionId: string;
  path: string;
  state: Record<string, unknown>;
}

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true }).catch(() => {});
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await writeFile(tempPath, JSON.stringify(value, null, 2));
  await rename(tempPath, path);
}

function isTerminalRalphPhase(value: unknown): boolean {
  return RALPH_TERMINAL_PHASES.has(safeString(value).trim().toLowerCase());
}

function isActiveRalphCandidate(state: Record<string, unknown> | null): state is Record<string, unknown> {
  if (!state || typeof state !== 'object') return false;
  return state.active === true && !isTerminalRalphPhase(state.current_phase);
}

async function readCurrentOmxSessionId(stateDir: string): Promise<string> {
  const session = await readJson(join(stateDir, 'session.json'));
  const sessionId = safeString(session?.session_id).trim();
  return SESSION_ID_PATTERN.test(sessionId) ? sessionId : '';
}

function bindCurrentPane(state: Record<string, unknown>, nowIso: string, env: NodeJS.ProcessEnv = process.env): Record<string, unknown> {
  const paneId = resolveCodexPane() || captureTmuxPaneFromEnv(env);
  if (!paneId) return state;

  const next: Record<string, unknown> = {
    ...state,
    tmux_pane_id: paneId,
    tmux_pane_set_at: nowIso,
  };
  const sessionName = captureTmuxSessionNameFromPane(paneId);
  if (sessionName) {
    next.tmux_session_name = sessionName;
  }
  return next;
}

async function scanMatchingRalphCandidates(
  stateDir: string,
  currentOmxSessionId: string,
  payloadSessionId: string,
): Promise<RalphStateCandidate[]> {
  const sessionsRoot = join(stateDir, 'sessions');
  if (!existsSync(sessionsRoot)) return [];

  const entries = await readdir(sessionsRoot, { withFileTypes: true }).catch(() => []);
  const matches: RalphStateCandidate[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !SESSION_ID_PATTERN.test(entry.name) || entry.name === currentOmxSessionId) continue;
    const path = join(sessionsRoot, entry.name, 'ralph-state.json');
    if (!existsSync(path)) continue;
    const state = await readJson(path);
    if (!isActiveRalphCandidate(state)) continue;
    if (safeString(state.owner_codex_session_id).trim() !== payloadSessionId) continue;
    matches.push({
      sessionId: entry.name,
      path,
      state,
    });
  }
  return matches;
}

export async function reconcileRalphSessionResume({
  stateDir,
  payloadSessionId,
  payloadThreadId,
  env = process.env,
}: RalphSessionResumeParams): Promise<RalphSessionResumeResult> {
  const currentOmxSessionId = await readCurrentOmxSessionId(stateDir);
  if (!currentOmxSessionId) {
    return {
      currentOmxSessionId: '',
      resumed: false,
      updatedCurrentOwner: false,
      reason: 'current_omx_session_missing',
    };
  }

  const currentSessionDir = join(stateDir, 'sessions', currentOmxSessionId);
  const currentRalphPath = join(currentSessionDir, 'ralph-state.json');
  const currentRalphState = await readJson(currentRalphPath);
  const nowIso = new Date().toISOString();

  if (currentRalphState && currentRalphState.active === true) {
    let changed = false;
    const updated: Record<string, unknown> = { ...currentRalphState };
    if (safeString(updated.owner_omx_session_id).trim() !== currentOmxSessionId) {
      updated.owner_omx_session_id = currentOmxSessionId;
      changed = true;
    }
    if (payloadSessionId && !safeString(updated.owner_codex_session_id).trim()) {
      updated.owner_codex_session_id = payloadSessionId;
      changed = true;
    }
    if (payloadThreadId && !safeString(updated.owner_codex_thread_id).trim()) {
      updated.owner_codex_thread_id = payloadThreadId;
      changed = true;
    }
    const currentPaneId = resolveCodexPane() || captureTmuxPaneFromEnv(env);
    const currentStatePaneId = safeString(updated.tmux_pane_id).trim();
    const currentSessionName = safeString(updated.tmux_session_name).trim();
    if (currentPaneId && (currentPaneId !== currentStatePaneId || !currentSessionName)) {
      Object.assign(updated, bindCurrentPane(updated, nowIso, env));
      changed = true;
    }
    if (changed) {
      await writeJsonAtomic(currentRalphPath, updated);
    }
    return {
      currentOmxSessionId,
      resumed: false,
      updatedCurrentOwner: changed,
      reason: 'current_ralph_active',
      targetPath: currentRalphPath,
    };
  }

  if (currentRalphState) {
    return {
      currentOmxSessionId,
      resumed: false,
      updatedCurrentOwner: false,
      reason: 'current_ralph_present',
      targetPath: currentRalphPath,
    };
  }

  const normalizedPayloadSessionId = safeString(payloadSessionId).trim();
  if (!normalizedPayloadSessionId) {
    return {
      currentOmxSessionId,
      resumed: false,
      updatedCurrentOwner: false,
      reason: 'payload_codex_session_missing',
    };
  }

  const candidates = await scanMatchingRalphCandidates(stateDir, currentOmxSessionId, normalizedPayloadSessionId);
  if (candidates.length !== 1) {
    return {
      currentOmxSessionId,
      resumed: false,
      updatedCurrentOwner: false,
      reason: candidates.length === 0 ? 'no_matching_prior_ralph' : 'multiple_matching_prior_ralphs',
    };
  }

  const source = candidates[0];
  await mkdir(currentSessionDir, { recursive: true });

  const nextState = bindCurrentPane({
    ...source.state,
    owner_omx_session_id: currentOmxSessionId,
    owner_codex_session_id: normalizedPayloadSessionId,
    ...(payloadThreadId ? { owner_codex_thread_id: payloadThreadId } : {}),
    resumed_from_omx_session_id: safeString(source.state.owner_omx_session_id).trim() || source.sessionId,
    resumed_at: nowIso,
  }, nowIso, env);
  delete nextState.completed_at;
  delete nextState.stop_reason;
  delete nextState.transferred_to_session_id;
  delete nextState.transferred_at;

  const previousState: Record<string, unknown> = {
    ...source.state,
    active: false,
    current_phase: 'cancelled',
    completed_at: nowIso,
    stop_reason: 'ownership_transferred',
    transferred_to_session_id: currentOmxSessionId,
    transferred_at: nowIso,
  };

  await writeJsonAtomic(currentRalphPath, nextState);
  await writeJsonAtomic(source.path, previousState);

  return {
    currentOmxSessionId,
    resumed: true,
    updatedCurrentOwner: false,
    reason: 'resumed_same_codex_session',
    sourcePath: source.path,
    targetPath: currentRalphPath,
  };
}
