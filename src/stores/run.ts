import { writable } from 'svelte/store';
import { runJava } from '../lib/execution/interpreter';

export const runOutput = writable<string[]>([]);
export const runError = writable<string | null>(null);
export const hasRun = writable<boolean>(false);

export function runCode(code: string) {
  const result = runJava(code);
  runOutput.set(result.output);
  runError.set(result.error);
  hasRun.set(true);
}

// The Output panel's Clear button — back to "nothing's been run yet", not
// just an empty output list, so its placeholder text reappears too.
export function clearRunOutput() {
  runOutput.set([]);
  runError.set(null);
  hasRun.set(false);
}
