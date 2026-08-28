import { writable, get } from 'svelte/store';
import type { TranslationKey } from '../lib/i18n/translations';

// Six independent guided walkthroughs, each covering one concept end to
// end (declare -> ... -> run). "basic" is the only one a brand-new visitor
// sees automatically (see startTutorial below); the rest are reachable any
// time from the Tutorial submenu (see HelpMenu.svelte).
export const TUTORIAL_TRACKS = ['basic', 'variableConstAssignment', 'inputOutput', 'decision', 'forLoop', 'whileLoop'] as const;

export type TutorialTrackId = (typeof TUTORIAL_TRACKS)[number];

export const TRACK_LABEL_KEYS: Record<TutorialTrackId, TranslationKey> = {
  basic: 'tutorial.track.basic',
  variableConstAssignment: 'tutorial.track.variableConstAssignment',
  inputOutput: 'tutorial.track.inputOutput',
  decision: 'tutorial.track.decision',
  forLoop: 'tutorial.track.forLoop',
  whileLoop: 'tutorial.track.whileLoop',
};

interface TutorialStepDef {
  id: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  // Which element to draw attention to for this step — a CSS selector
  // matched against the live DOM (see TutorialCoach.svelte's own $effect).
  // Steps that just explain something have none, so nothing is highlighted.
  highlight?: string;
}

// Every track is a fully independent step list — translation keys are
// namespaced tutorial.step.<track>.<step>.title/body so content never
// collides between tracks even where two tracks use the same block (e.g.
// every track ends with its own end/arrange/run/done wording).
const TRACK_STEPS: Record<TutorialTrackId, TutorialStepDef[]> = {
  basic: [
    { id: 'welcome', titleKey: 'tutorial.step.basic.welcome.title', bodyKey: 'tutorial.step.basic.welcome.body' },
    {
      id: 'declareName',
      titleKey: 'tutorial.step.basic.declareName.title',
      bodyKey: 'tutorial.step.basic.declareName.body',
      highlight: '[data-block-chip="declare"]',
    },
    {
      id: 'output',
      titleKey: 'tutorial.step.basic.output.title',
      bodyKey: 'tutorial.step.basic.output.body',
      highlight: '[data-block-chip="process"]',
    },
    { id: 'end', titleKey: 'tutorial.step.basic.end.title', bodyKey: 'tutorial.step.basic.end.body', highlight: '[data-block-chip="end"]' },
    {
      id: 'arrange',
      titleKey: 'tutorial.step.basic.arrange.title',
      bodyKey: 'tutorial.step.basic.arrange.body',
      highlight: '[data-tutorial-canvas-menu]',
    },
    {
      id: 'run',
      titleKey: 'tutorial.step.basic.run.title',
      bodyKey: 'tutorial.step.basic.run.body',
      highlight: '[data-tutorial-run-button]',
    },
    { id: 'done', titleKey: 'tutorial.step.basic.done.title', bodyKey: 'tutorial.step.basic.done.body' },
  ],
  variableConstAssignment: [
    { id: 'welcome', titleKey: 'tutorial.step.vca.welcome.title', bodyKey: 'tutorial.step.vca.welcome.body' },
    {
      id: 'declareRadius',
      titleKey: 'tutorial.step.vca.declareRadius.title',
      bodyKey: 'tutorial.step.vca.declareRadius.body',
      highlight: '[data-block-chip="declare"]',
    },
    { id: 'declarePi', titleKey: 'tutorial.step.vca.declarePi.title', bodyKey: 'tutorial.step.vca.declarePi.body' },
    { id: 'declareArea', titleKey: 'tutorial.step.vca.declareArea.title', bodyKey: 'tutorial.step.vca.declareArea.body' },
    {
      id: 'assign',
      titleKey: 'tutorial.step.vca.assign.title',
      bodyKey: 'tutorial.step.vca.assign.body',
      highlight: '[data-block-chip="assign"]',
    },
    {
      id: 'output',
      titleKey: 'tutorial.step.vca.output.title',
      bodyKey: 'tutorial.step.vca.output.body',
      highlight: '[data-block-chip="process"]',
    },
    { id: 'end', titleKey: 'tutorial.step.vca.end.title', bodyKey: 'tutorial.step.vca.end.body', highlight: '[data-block-chip="end"]' },
    {
      id: 'arrange',
      titleKey: 'tutorial.step.vca.arrange.title',
      bodyKey: 'tutorial.step.vca.arrange.body',
      highlight: '[data-tutorial-canvas-menu]',
    },
    {
      id: 'run',
      titleKey: 'tutorial.step.vca.run.title',
      bodyKey: 'tutorial.step.vca.run.body',
      highlight: '[data-tutorial-run-button]',
    },
    { id: 'done', titleKey: 'tutorial.step.vca.done.title', bodyKey: 'tutorial.step.vca.done.body' },
  ],
  inputOutput: [
    { id: 'welcome', titleKey: 'tutorial.step.io.welcome.title', bodyKey: 'tutorial.step.io.welcome.body' },
    {
      id: 'declareVar',
      titleKey: 'tutorial.step.io.declareVar.title',
      bodyKey: 'tutorial.step.io.declareVar.body',
      highlight: '[data-block-chip="declare"]',
    },
    {
      id: 'input',
      titleKey: 'tutorial.step.io.input.title',
      bodyKey: 'tutorial.step.io.input.body',
      highlight: '[data-block-chip="input"]',
    },
    {
      id: 'output',
      titleKey: 'tutorial.step.io.output.title',
      bodyKey: 'tutorial.step.io.output.body',
      highlight: '[data-block-chip="process"]',
    },
    { id: 'end', titleKey: 'tutorial.step.io.end.title', bodyKey: 'tutorial.step.io.end.body', highlight: '[data-block-chip="end"]' },
    {
      id: 'arrange',
      titleKey: 'tutorial.step.io.arrange.title',
      bodyKey: 'tutorial.step.io.arrange.body',
      highlight: '[data-tutorial-canvas-menu]',
    },
    {
      id: 'run',
      titleKey: 'tutorial.step.io.run.title',
      bodyKey: 'tutorial.step.io.run.body',
      highlight: '[data-tutorial-run-button]',
    },
    { id: 'done', titleKey: 'tutorial.step.io.done.title', bodyKey: 'tutorial.step.io.done.body' },
  ],
  decision: [
    { id: 'welcome', titleKey: 'tutorial.step.decision.welcome.title', bodyKey: 'tutorial.step.decision.welcome.body' },
    {
      id: 'declareNumber',
      titleKey: 'tutorial.step.decision.declareNumber.title',
      bodyKey: 'tutorial.step.decision.declareNumber.body',
      highlight: '[data-block-chip="declare"]',
    },
    {
      id: 'decision',
      titleKey: 'tutorial.step.decision.decision.title',
      bodyKey: 'tutorial.step.decision.decision.body',
      highlight: '[data-block-chip="decision"]',
    },
    {
      id: 'outputEven',
      titleKey: 'tutorial.step.decision.outputEven.title',
      bodyKey: 'tutorial.step.decision.outputEven.body',
      highlight: '[data-block-chip="process"]',
    },
    {
      id: 'outputOdd',
      titleKey: 'tutorial.step.decision.outputOdd.title',
      bodyKey: 'tutorial.step.decision.outputOdd.body',
      highlight: '[data-block-chip="process"]',
    },
    {
      id: 'end',
      titleKey: 'tutorial.step.decision.end.title',
      bodyKey: 'tutorial.step.decision.end.body',
      highlight: '[data-block-chip="end"]',
    },
    {
      id: 'arrange',
      titleKey: 'tutorial.step.decision.arrange.title',
      bodyKey: 'tutorial.step.decision.arrange.body',
      highlight: '[data-tutorial-canvas-menu]',
    },
    {
      id: 'run',
      titleKey: 'tutorial.step.decision.run.title',
      bodyKey: 'tutorial.step.decision.run.body',
      highlight: '[data-tutorial-run-button]',
    },
    { id: 'done', titleKey: 'tutorial.step.decision.done.title', bodyKey: 'tutorial.step.decision.done.body' },
  ],
  forLoop: [
    { id: 'welcome', titleKey: 'tutorial.step.forLoop.welcome.title', bodyKey: 'tutorial.step.forLoop.welcome.body' },
    {
      id: 'forLoop',
      titleKey: 'tutorial.step.forLoop.forLoop.title',
      bodyKey: 'tutorial.step.forLoop.forLoop.body',
      highlight: '[data-block-chip="forLoop"]',
    },
    {
      id: 'output',
      titleKey: 'tutorial.step.forLoop.output.title',
      bodyKey: 'tutorial.step.forLoop.output.body',
      highlight: '[data-block-chip="process"]',
    },
    {
      id: 'end',
      titleKey: 'tutorial.step.forLoop.end.title',
      bodyKey: 'tutorial.step.forLoop.end.body',
      highlight: '[data-block-chip="end"]',
    },
    {
      id: 'arrange',
      titleKey: 'tutorial.step.forLoop.arrange.title',
      bodyKey: 'tutorial.step.forLoop.arrange.body',
      highlight: '[data-tutorial-canvas-menu]',
    },
    {
      id: 'run',
      titleKey: 'tutorial.step.forLoop.run.title',
      bodyKey: 'tutorial.step.forLoop.run.body',
      highlight: '[data-tutorial-run-button]',
    },
    { id: 'done', titleKey: 'tutorial.step.forLoop.done.title', bodyKey: 'tutorial.step.forLoop.done.body' },
  ],
  whileLoop: [
    { id: 'welcome', titleKey: 'tutorial.step.whileLoop.welcome.title', bodyKey: 'tutorial.step.whileLoop.welcome.body' },
    {
      id: 'declareCounter',
      titleKey: 'tutorial.step.whileLoop.declareCounter.title',
      bodyKey: 'tutorial.step.whileLoop.declareCounter.body',
      highlight: '[data-block-chip="declare"]',
    },
    {
      id: 'whileLoop',
      titleKey: 'tutorial.step.whileLoop.whileLoop.title',
      bodyKey: 'tutorial.step.whileLoop.whileLoop.body',
      highlight: '[data-block-chip="whileLoop"]',
    },
    {
      id: 'output',
      titleKey: 'tutorial.step.whileLoop.output.title',
      bodyKey: 'tutorial.step.whileLoop.output.body',
      highlight: '[data-block-chip="process"]',
    },
    {
      id: 'assignIncrement',
      titleKey: 'tutorial.step.whileLoop.assignIncrement.title',
      bodyKey: 'tutorial.step.whileLoop.assignIncrement.body',
      highlight: '[data-block-chip="assign"]',
    },
    {
      id: 'end',
      titleKey: 'tutorial.step.whileLoop.end.title',
      bodyKey: 'tutorial.step.whileLoop.end.body',
      highlight: '[data-block-chip="end"]',
    },
    {
      id: 'arrange',
      titleKey: 'tutorial.step.whileLoop.arrange.title',
      bodyKey: 'tutorial.step.whileLoop.arrange.body',
      highlight: '[data-tutorial-canvas-menu]',
    },
    {
      id: 'run',
      titleKey: 'tutorial.step.whileLoop.run.title',
      bodyKey: 'tutorial.step.whileLoop.run.body',
      highlight: '[data-tutorial-run-button]',
    },
    { id: 'done', titleKey: 'tutorial.step.whileLoop.done.title', bodyKey: 'tutorial.step.whileLoop.done.body' },
  ],
};

export function tutorialTrackSteps(track: TutorialTrackId): TutorialStepDef[] {
  return TRACK_STEPS[track];
}

const SEEN_STORAGE_KEY = 'koudo-tutorial-seen';

function hasSeenTutorial(): boolean {
  return localStorage.getItem(SEEN_STORAGE_KEY) === '1';
}

function markTutorialSeen() {
  localStorage.setItem(SEEN_STORAGE_KEY, '1');
}

// Shown once, automatically, for a first-time visitor (see App.svelte) —
// language choice + Start/Skip. Never shown again on its own afterward;
// reopening the tutorial later (see the Tutorial submenu) goes straight
// into the step coach instead, skipping this screen.
export const showWelcome = writable<boolean>(!hasSeenTutorial());

export const tutorialActive = writable(false);
export const tutorialTrack = writable<TutorialTrackId>('basic');
export const tutorialStepIndex = writable(0);

// A brand-new visitor always starts on "basic" — the other five tracks are
// reachable afterward from the Tutorial submenu (see reopenTutorial below).
export function startTutorial() {
  showWelcome.set(false);
  markTutorialSeen();
  tutorialTrack.set('basic');
  tutorialStepIndex.set(0);
  tutorialActive.set(true);
}

export function skipTutorial() {
  showWelcome.set(false);
  markTutorialSeen();
}

export function nextTutorialStep() {
  const stepCount = TRACK_STEPS[get(tutorialTrack)].length;
  tutorialStepIndex.update((index) => Math.min(index + 1, stepCount - 1));
}

export function prevTutorialStep() {
  tutorialStepIndex.update((index) => Math.max(index - 1, 0));
}

export function closeTutorial() {
  tutorialActive.set(false);
  markTutorialSeen();
}

// The Tutorial submenu's per-guide buttons (see HelpMenu.svelte) — reachable
// any time, not just for a first-time visitor, so someone can revisit any
// guide later without clearing localStorage.
export function reopenTutorial(track: TutorialTrackId = 'basic') {
  tutorialTrack.set(track);
  tutorialStepIndex.set(0);
  tutorialActive.set(true);
}
