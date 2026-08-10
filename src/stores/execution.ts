import { derived, get, writable } from 'svelte/store';
import type { LoopStep } from '../lib/execution/loopTracer';

// Not wired to the flowchart/code yet — populated once the real
// parser/interpreter lands (see CLAUDE.md > Execution Engine Decision).
export const loopSteps = writable<LoopStep[]>([]);

export const currentStepIndex = writable<number>(-1);

export const currentStep = derived(
  [loopSteps, currentStepIndex],
  ([$steps, $index]) => ($index >= 0 && $index < $steps.length ? $steps[$index] : null),
);

export const isTracing = derived(currentStepIndex, ($index) => $index >= 0);

export function nextStep() {
  const steps = get(loopSteps);
  currentStepIndex.update((i) => Math.min(i + 1, steps.length - 1));
}

export function resetTrace() {
  currentStepIndex.set(-1);
}
