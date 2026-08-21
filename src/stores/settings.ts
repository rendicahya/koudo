import { writable } from 'svelte/store';

// 'inferred' (Beginner mode): declaring a variable needs only a value — its
// type is auto-detected from what's typed (see lib/flowchart/typeInference.ts),
// so a learner never has to know Java's type names up front. 'explicit'
// (Standard mode) is this app's original behavior: pick a type, value
// optional. Standard is the default — see DeclareNode.svelte for how each
// mode changes the Declare block's own fields.
export type VariableMode = 'inferred' | 'explicit';

const STORAGE_KEY = 'koudo-variable-mode';

function getInitialMode(): VariableMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'inferred' ? 'inferred' : 'explicit';
}

export const variableMode = writable<VariableMode>(getInitialMode());

variableMode.subscribe((value) => {
  localStorage.setItem(STORAGE_KEY, value);
});

export function setVariableMode(mode: VariableMode) {
  variableMode.set(mode);
}
