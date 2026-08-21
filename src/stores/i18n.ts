import { derived, writable } from 'svelte/store';
import { translations, type TranslationKey } from '../lib/i18n/translations';

// Switchable from TopNavbar's Project menu, persisted the same way
// stores/settings.ts persists the variable mode. English is the default —
// Indonesian is an opt-in setting, not a locale auto-detected from the
// browser, so a first-time visitor always sees the app in the language it
// was originally written in.
export type Language = 'en' | 'id';

const STORAGE_KEY = 'koudo-language';

function getInitialLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY) === 'id' ? 'id' : 'en';
}

export const language = writable<Language>(getInitialLanguage());

language.subscribe((value) => {
  localStorage.setItem(STORAGE_KEY, value);
});

export function setLanguage(lang: Language) {
  language.set(lang);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

// A derived store holding a lookup *function* (not the strings themselves)
// — components call `$t('some.key')` reactively in their markup, the same
// way they'd read any other store, but get a translated, optionally
// interpolated string back instead of a plain value. Falls back to English
// if a key is somehow missing from the current language (shouldn't happen —
// translations.ts types `id` against the exact same key set as `en` — but
// cheaper than a runtime crash if it ever does).
export const t = derived(language, ($language) => {
  return (key: TranslationKey, params?: Record<string, string | number>) =>
    interpolate(translations[$language][key] ?? translations.en[key], params);
});
