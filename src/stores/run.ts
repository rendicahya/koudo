import { writable } from 'svelte/store';
import { runJava, type VariableSnapshot } from '../lib/execution/interpreter';

export const runOutput = writable<string[]>([]);
export const runError = writable<string | null>(null);
export const hasRun = writable<boolean>(false);
// Final variable values from the most recent ▶ Run — lets the Variable
// Watcher (see OutputPanel.svelte) show something meaningful outside of a
// Step Through too, not just while one's active.
export const runVariables = writable<VariableSnapshot[]>([]);

export function runCode(code: string) {
  const result = runJava(code);
  runOutput.set(result.output);
  runError.set(result.error);
  runVariables.set(result.variables);
  hasRun.set(true);
}

// The Output panel's Clear button — back to "nothing's been run yet", not
// just an empty output list, so its placeholder text reappears too.
export function clearRunOutput() {
  runOutput.set([]);
  runError.set(null);
  runVariables.set([]);
  hasRun.set(false);
}
