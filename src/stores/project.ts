import { writable } from 'svelte/store';

// Not persisted to localStorage — same as the flowchart itself (see
// stores/flowchart.ts), the canvas doesn't survive a refresh without an
// explicit Save, so there's nothing for a remembered name to outlive it for.
// Reset back to this on New, and overwritten from the file's own name on
// Open (see TopNavbar.svelte's handleNew/handleFileSelected).
export const DEFAULT_PROJECT_NAME = 'Untitled Project';

export const projectName = writable<string>(DEFAULT_PROJECT_NAME);

export function setProjectName(name: string): void {
  projectName.set(name.trim() || DEFAULT_PROJECT_NAME);
}
