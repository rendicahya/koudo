import { writable } from 'svelte/store';

// Toggled from TopNavbar, read by App.svelte (which owns the flowchart/code
// split) — a plain store rather than local state so the button doesn't have
// to live inside App.svelte itself alongside the other top-bar actions.
export const isCodePanelHidden = writable(false);

export function toggleCodePanel() {
  isCodePanelHidden.update((hidden) => !hidden);
}

// Which tab of the code panel (see CodeEditorPanel.svelte) is showing —
// persisted the same way stores/theme.ts persists dark/light mode, so
// switching to Java and refreshing doesn't silently bounce back to the
// default. Pseudocode, not Java, is the default: it reads without needing
// any Java syntax knowledge first, matching this app's beginner-first bent.
export type CodeTab = 'Pseudocode' | 'Java';

const CODE_TAB_STORAGE_KEY = 'koudo-code-tab';

function getInitialCodeTab(): CodeTab {
  return localStorage.getItem(CODE_TAB_STORAGE_KEY) === 'Java' ? 'Java' : 'Pseudocode';
}

export const activeCodeTab = writable<CodeTab>(getInitialCodeTab());

activeCodeTab.subscribe((value) => {
  localStorage.setItem(CODE_TAB_STORAGE_KEY, value);
});

// Shared by both code tabs (CodeEditorPanel.svelte's zoom buttons) — Monaco
// reads it for the Java tab's fontSize option, PseudocodeView applies it as
// a plain CSS font-size, so the two stay in sync under one control instead
// of each tab having its own separate zoom level.
const CODE_FONT_SIZE_STORAGE_KEY = 'koudo-code-font-size';
const DEFAULT_CODE_FONT_SIZE = 14;
export const MIN_CODE_FONT_SIZE = 10;
export const MAX_CODE_FONT_SIZE = 24;

function getInitialCodeFontSize(): number {
  const stored = Number(localStorage.getItem(CODE_FONT_SIZE_STORAGE_KEY));
  if (!Number.isFinite(stored) || stored < MIN_CODE_FONT_SIZE || stored > MAX_CODE_FONT_SIZE) {
    return DEFAULT_CODE_FONT_SIZE;
  }
  return stored;
}

export const codeFontSize = writable<number>(getInitialCodeFontSize());

codeFontSize.subscribe((value) => {
  localStorage.setItem(CODE_FONT_SIZE_STORAGE_KEY, String(value));
});

export function zoomCodeFontSize(delta: number) {
  codeFontSize.update((size) => Math.min(MAX_CODE_FONT_SIZE, Math.max(MIN_CODE_FONT_SIZE, size + delta)));
}
