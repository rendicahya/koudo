import { writable } from 'svelte/store';

// A small non-blocking banner for informational warnings (e.g. "declare a
// variable first") — unlike alert(), it doesn't freeze the page waiting for
// a click, so it doesn't interrupt a drag-and-drop flow the way a native
// alert() does (which can even suppress the drop's own visual feedback until
// dismissed).
export const toastMessage = writable<string | null>(null);

let dismissTimeout: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, durationMs = 5000): void {
  clearTimeout(dismissTimeout);
  toastMessage.set(message);
  dismissTimeout = setTimeout(() => toastMessage.set(null), durationMs);
}

export function dismissToast(): void {
  clearTimeout(dismissTimeout);
  toastMessage.set(null);
}
