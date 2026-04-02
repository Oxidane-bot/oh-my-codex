import { execFileSync } from 'child_process';

export interface ModeStateContextLike {
  active?: unknown;
  tmux_pane_id?: unknown;
  tmux_pane_set_at?: unknown;
  tmux_session_name?: unknown;
  [key: string]: unknown;
}

export function captureTmuxPaneFromEnv(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.TMUX_PANE;
  if (typeof value !== 'string') return null;
  const pane = value.trim();
  return pane.length > 0 ? pane : null;
}

export function captureTmuxSessionNameFromPane(pane: string | null | undefined): string | null {
  const target = typeof pane === 'string' ? pane.trim() : '';
  if (!target) return null;
  try {
    const sessionName = execFileSync('tmux', ['display-message', '-p', '-t', target, '#S'], {
      encoding: 'utf-8',
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return sessionName || null;
  } catch {
    return null;
  }
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

export function withModeRuntimeContext<T extends ModeStateContextLike>(
  existing: ModeStateContextLike,
  next: T,
  options?: { env?: NodeJS.ProcessEnv; nowIso?: string }
): T {
  const env = options?.env ?? process.env;
  const nowIso = options?.nowIso ?? new Date().toISOString();
  const wasActive = existing.active === true;
  const isActive = next.active === true;
  const hasPane = hasNonEmptyString(next.tmux_pane_id);
  const hasSessionName = hasNonEmptyString(next.tmux_session_name);
  let paneForSessionName = hasPane ? String(next.tmux_pane_id).trim() : '';

  if (isActive && (!wasActive || !hasPane)) {
    const pane = captureTmuxPaneFromEnv(env);
    if (pane) {
      next.tmux_pane_id = pane;
      paneForSessionName = pane;
      if (!hasNonEmptyString(next.tmux_pane_set_at)) {
        next.tmux_pane_set_at = nowIso;
      }
    }
  }

  if (!paneForSessionName && hasNonEmptyString(existing.tmux_pane_id)) {
    paneForSessionName = String(existing.tmux_pane_id).trim();
  }

  if (isActive && (!wasActive || !hasSessionName) && paneForSessionName) {
    const sessionName = captureTmuxSessionNameFromPane(paneForSessionName);
    if (sessionName) {
      next.tmux_session_name = sessionName;
    }
  }

  return next;
}
