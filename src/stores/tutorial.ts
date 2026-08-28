import { writable } from 'svelte/store';
import type { TranslationKey } from '../lib/i18n/translations';

// Ordered — index also drives the step counter shown in TutorialCoach.svelte
// ("Step X of N"). Each id maps to a `tutorial.step.<id>.title`/`.body` pair
// in translations.ts (see STEP_CONTENT_KEYS below) and, for steps that call
// for dragging a specific palette chip or clicking a specific button, a CSS
// selector in STEP_HIGHLIGHT.
export const TUTORIAL_STEPS = [
  'welcome',
  'declareRadius',
  'declarePi',
  'declareArea',
  'assign',
  'output',
  'end',
  'arrange',
  'run',
  'done',
] as const;

export type TutorialStepId = (typeof TUTORIAL_STEPS)[number];

// Keyed by literal step id (not a template-literal lookup) so TypeScript
// checks every key actually exists in translations.ts — same pattern as
// BlockPalette.svelte's own BLOCK_TYPE_LABEL_KEY.
export const STEP_CONTENT_KEYS: Record<TutorialStepId, { titleKey: TranslationKey; bodyKey: TranslationKey }> = {
  welcome: { titleKey: 'tutorial.step.welcome.title', bodyKey: 'tutorial.step.welcome.body' },
  declareRadius: { titleKey: 'tutorial.step.declareRadius.title', bodyKey: 'tutorial.step.declareRadius.body' },
  declarePi: { titleKey: 'tutorial.step.declarePi.title', bodyKey: 'tutorial.step.declarePi.body' },
  declareArea: { titleKey: 'tutorial.step.declareArea.title', bodyKey: 'tutorial.step.declareArea.body' },
  assign: { titleKey: 'tutorial.step.assign.title', bodyKey: 'tutorial.step.assign.body' },
  output: { titleKey: 'tutorial.step.output.title', bodyKey: 'tutorial.step.output.body' },
  end: { titleKey: 'tutorial.step.end.title', bodyKey: 'tutorial.step.end.body' },
  arrange: { titleKey: 'tutorial.step.arrange.title', bodyKey: 'tutorial.step.arrange.body' },
  run: { titleKey: 'tutorial.step.run.title', bodyKey: 'tutorial.step.run.body' },
  done: { titleKey: 'tutorial.step.done.title', bodyKey: 'tutorial.step.done.body' },
};

// Which element to draw attention to for a given step — a CSS selector
// matched against the live DOM (see TutorialCoach.svelte's own $effect).
// Steps that just explain something (welcome/declarePi/declareArea/done —
// the "+ Add variable" clicks happen inside a block already on the canvas,
// nowhere fixed enough to point at) have no entry, so nothing is highlighted.
export const STEP_HIGHLIGHT: Partial<Record<TutorialStepId, string>> = {
  declareRadius: '[data-block-chip="declare"]',
  assign: '[data-block-chip="assign"]',
  output: '[data-block-chip="process"]',
  end: '[data-block-chip="end"]',
  arrange: '[data-tutorial-canvas-menu]',
  run: '[data-tutorial-run-button]',
};

const SEEN_STORAGE_KEY = 'koudo-tutorial-seen';

function hasSeenTutorial(): boolean {
  return localStorage.getItem(SEEN_STORAGE_KEY) === '1';
}

function markTutorialSeen() {
  localStorage.setItem(SEEN_STORAGE_KEY, '1');
}

// Shown once, automatically, for a first-time visitor (see App.svelte) —
// language choice + Start/Skip. Never shown again on its own afterward;
// reopening the tutorial later (see the Tutorial nav button) goes straight
// into the step coach instead, skipping this screen.
export const showWelcome = writable<boolean>(!hasSeenTutorial());

export const tutorialActive = writable(false);
export const tutorialStepIndex = writable(0);

export function startTutorial() {
  showWelcome.set(false);
  markTutorialSeen();
  tutorialStepIndex.set(0);
  tutorialActive.set(true);
}

export function skipTutorial() {
  showWelcome.set(false);
  markTutorialSeen();
}

export function nextTutorialStep() {
  tutorialStepIndex.update((index) => Math.min(index + 1, TUTORIAL_STEPS.length - 1));
}

export function prevTutorialStep() {
  tutorialStepIndex.update((index) => Math.max(index - 1, 0));
}

export function closeTutorial() {
  tutorialActive.set(false);
  markTutorialSeen();
}

// The "Tutorial" nav button (see TopNavbar.svelte) — reachable any time,
// not just for a first-time visitor, so someone can revisit it later
// without clearing localStorage.
export function reopenTutorial() {
  tutorialStepIndex.set(0);
  tutorialActive.set(true);
}
