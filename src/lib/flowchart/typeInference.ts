// Beginner mode's whole point (see stores/settings.ts) is that a learner
// never picks a type — it's inferred from whatever they type into the value
// field, live on every keystroke (see DeclareNode.svelte). Only the four
// types a raw value can unambiguously suggest are inferred; 'long', 'float',
// and 'char' stay reachable only through Standard mode's explicit type
// <select>.
const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+\.\d+$/;

export function inferDeclaredType(rawValue: string): string {
  const value = rawValue.trim();
  if (INTEGER_PATTERN.test(value)) return 'int';
  if (DECIMAL_PATTERN.test(value)) return 'double';
  if (value === 'true' || value === 'false') return 'boolean';
  return 'String';
}
