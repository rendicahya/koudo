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
