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

// How the generated code's indentation is displayed — generator.ts and
// generatorPseudocode.ts both emit a fixed 4-space step per nesting level
// (see lib/codeIndent.ts's reindent, which converts that fixed output to
// whichever of these the user picked), same persisted pattern as the rest
// of this file. Shared by the Java tab and Pseudocode tab, same reasoning
// as codeFontSize above — one setting, not two independently-drifting ones.
export type CodeIndentStyle = '2' | '4' | 'tab';

const CODE_INDENT_STORAGE_KEY = 'koudo-code-indent';
const DEFAULT_CODE_INDENT: CodeIndentStyle = '4';

function getInitialCodeIndent(): CodeIndentStyle {
  const stored = localStorage.getItem(CODE_INDENT_STORAGE_KEY);
  return stored === '2' || stored === '4' || stored === 'tab' ? stored : DEFAULT_CODE_INDENT;
}

export const codeIndentStyle = writable<CodeIndentStyle>(getInitialCodeIndent());

codeIndentStyle.subscribe((value) => {
  localStorage.setItem(CODE_INDENT_STORAGE_KEY, value);
});

export function setCodeIndentStyle(style: CodeIndentStyle) {
  codeIndentStyle.set(style);
}

// The code panel's font — a fixed short list of common monospace coding
// fonts rather than free text, since anything else risks landing on a
// font the user doesn't actually have installed with no good fallback.
// Nothing here is fetched over the network (this app runs entirely in the
// browser — see help.tips.browserOnly): each stack just falls back to a
// generic monospace font if the named one isn't installed locally.
export interface CodeFontOption {
  id: string;
  label: string;
  stack: string;
}

const GENERIC_MONOSPACE = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const CODE_FONT_OPTIONS: CodeFontOption[] = [
  { id: 'default', label: 'Default', stack: GENERIC_MONOSPACE },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', stack: `'JetBrains Mono', ${GENERIC_MONOSPACE}` },
  { id: 'fira-code', label: 'Fira Code', stack: `'Fira Code', ${GENERIC_MONOSPACE}` },
  { id: 'cascadia-code', label: 'Cascadia Code', stack: `'Cascadia Code', ${GENERIC_MONOSPACE}` },
  { id: 'consolas', label: 'Consolas', stack: `Consolas, ${GENERIC_MONOSPACE}` },
  { id: 'roboto-mono', label: 'Roboto Mono', stack: `'Roboto Mono', ${GENERIC_MONOSPACE}` },
];

const CODE_FONT_STORAGE_KEY = 'koudo-code-font';
const DEFAULT_CODE_FONT_ID = 'default';

function getInitialCodeFontId(): string {
  const stored = localStorage.getItem(CODE_FONT_STORAGE_KEY);
  return CODE_FONT_OPTIONS.some((font) => font.id === stored) ? (stored as string) : DEFAULT_CODE_FONT_ID;
}

export const codeFontId = writable<string>(getInitialCodeFontId());

codeFontId.subscribe((value) => {
  localStorage.setItem(CODE_FONT_STORAGE_KEY, value);
});

export function setCodeFontId(id: string) {
  codeFontId.set(id);
}

export function codeFontStackFor(id: string): string {
  return CODE_FONT_OPTIONS.find((font) => font.id === id)?.stack ?? CODE_FONT_OPTIONS[0].stack;
}
