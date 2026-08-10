import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'koudo-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const theme = writable<Theme>(getInitialTheme());

theme.subscribe((value) => {
  document.documentElement.setAttribute('data-theme', value);
  localStorage.setItem(STORAGE_KEY, value);
});

export function toggleTheme() {
  theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
}
