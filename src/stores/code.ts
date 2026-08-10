import { writable } from 'svelte/store';

// Kept up to date by stores/sync.ts in both directions: regenerated when
// the flowchart changes, parsed for variable declarations when typed here.
export const codeContent = writable<string>('');
