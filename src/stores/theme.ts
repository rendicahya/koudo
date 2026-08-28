import { derived, writable } from 'svelte/store';

// Four palettes per group, paired by name (light-warm <-> dark-warm) so
// toggleTheme() below can flip groups while keeping the same "flavor".
export const LIGHT_THEMES = ['light-default', 'light-warm', 'light-cool', 'light-nature'] as const;
export const DARK_THEMES = ['dark-default', 'dark-warm', 'dark-cool', 'dark-nature'] as const;

export type ThemeId = (typeof LIGHT_THEMES)[number] | (typeof DARK_THEMES)[number];
// What's actually persisted/selectable — 'system' additionally tracks the
// OS-level prefers-color-scheme instead of pinning one palette.
export type ThemePreference = ThemeId | 'system';

const ALL_THEME_IDS: readonly string[] = [...LIGHT_THEMES, ...DARK_THEMES];

// Swatch colors for the Preferences menu's theme picker — kept in sync by
// hand with the matching :root[data-theme='...'] block in styles/theme.css.
export const THEME_SWATCHES: Record<ThemeId, { bg: string; accent: string }> = {
  'light-default': { bg: '#ffffff', accent: '#0066ff' },
  'light-warm': { bg: '#fffaf0', accent: '#e0651a' },
  'light-cool': { bg: '#f8fafc', accent: '#6d28d9' },
  'light-nature': { bg: '#f5fbf6', accent: '#059669' },
  'dark-default': { bg: '#0a0e27', accent: '#00d9ff' },
  'dark-warm': { bg: '#241a12', accent: '#ff9d42' },
  'dark-cool': { bg: '#14122b', accent: '#a78bfa' },
  'dark-nature': { bg: '#0b1d17', accent: '#34d399' },
};

const STORAGE_KEY = 'koudo-theme';

function isThemeId(value: string | null): value is ThemeId {
  return !!value && ALL_THEME_IDS.includes(value);
}

function getInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'system' || isThemeId(stored)) return stored;
  return 'system';
}

export const themePreference = writable<ThemePreference>(getInitialPreference());

const media = window.matchMedia('(prefers-color-scheme: dark)');
export const systemPrefersDark = writable(media.matches);
media.addEventListener('change', (event) => systemPrefersDark.set(event.matches));

// The palette actually applied to the page — 'system' resolves to the
// default light/dark palette based on the OS preference, tracked live.
export const theme = derived<[typeof themePreference, typeof systemPrefersDark], ThemeId>(
  [themePreference, systemPrefersDark],
  ([$preference, $systemPrefersDark]) => {
    if ($preference !== 'system') return $preference;
    return $systemPrefersDark ? 'dark-default' : 'light-default';
  },
);

export const isDark = derived(theme, ($theme) => (DARK_THEMES as readonly string[]).includes($theme));

theme.subscribe((value) => {
  document.documentElement.setAttribute('data-theme', value);
});

themePreference.subscribe((value) => {
  localStorage.setItem(STORAGE_KEY, value);
});

export function setThemePreference(preference: ThemePreference) {
  themePreference.set(preference);
}

// Alt+Shift+T — flips light/dark while keeping the same flavor (e.g.
// light-warm <-> dark-warm). 'system' flips to the explicit opposite of
// whatever it's currently resolving to, since there's no single palette to
// toggle "back" to.
export function toggleTheme() {
  themePreference.update((preference) => {
    const current = preference === 'system' ? (media.matches ? 'dark-default' : 'light-default') : preference;
    const lightIndex = (LIGHT_THEMES as readonly string[]).indexOf(current);
    if (lightIndex !== -1) return DARK_THEMES[lightIndex];
    const darkIndex = (DARK_THEMES as readonly string[]).indexOf(current);
    return LIGHT_THEMES[darkIndex];
  });
}
