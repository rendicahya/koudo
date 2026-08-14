import { writable } from 'svelte/store';

// Toggled from TopNavbar, read by App.svelte (which owns the flowchart/code
// split) — a plain store rather than local state so the button doesn't have
// to live inside App.svelte itself alongside the other top-bar actions.
export const isCodePanelHidden = writable(false);

export function toggleCodePanel() {
  isCodePanelHidden.update((hidden) => !hidden);
}
