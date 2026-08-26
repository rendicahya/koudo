import { writable } from 'svelte/store';

// Not persisted to localStorage — same as the flowchart itself (see
// stores/flowchart.ts), the canvas doesn't survive a refresh without an
// explicit Save, so there's nothing for a remembered name to outlive it for.
// Reset back to this on New, and overwritten from the file's own name on
// Open (see TopNavbar.svelte's handleNew/handleFileSelected).
export const DEFAULT_PROJECT_NAME = 'Untitled Project';

export const projectName = writable<string>(DEFAULT_PROJECT_NAME);

// Used while the user is actively typing (see TopNavbar's project-name
// input, on every keystroke) — keeps anything derived from the name (the
// Java tab's class name, in particular) live as they type, without
// trimming or falling back to the default the way setProjectName does.
// Applying either of those mid-typing would fight the field: trimming a
// trailing space the instant it's typed makes multi-word names hard to
// type, and falling back to the default while the field is briefly empty
// (e.g. selecting all and about to type a new name) would flash it there.
export function setProjectNameLive(name: string): void {
  projectName.set(name);
}

export function setProjectName(name: string): void {
  projectName.set(name.trim() || DEFAULT_PROJECT_NAME);
}
