import { writable } from 'svelte/store';
import { runJava } from '../lib/execution/interpreter';

export const runOutput = writable<string[]>([]);
export const runError = writable<string | null>(null);
export const hasRun = writable<boolean>(false);

// Shared with App.svelte's footer tabs — Play lives in the top navbar now,
// so running code needs to be able to surface the Output tab itself.
export const footerTab = writable<'output' | 'tracer'>('output');

export function runCode(code: string) {
  const result = runJava(code);
  runOutput.set(result.output);
  runError.set(result.error);
  hasRun.set(true);
  footerTab.set('output');
}
