// Shared array-type helpers used across codegen (generator.ts, valueFormat.ts),
// two-way sync (declarationParser.ts), and the block components that let a
// user reference a single array element (Process/Assign/Input). An array
// variable is just a DeclarationEntry whose varType ends in "[]" — no new
// fields anywhere, so every existing varType/varValue consumer that treats
// them as opaque strings keeps working unchanged.

export function isArrayType(varType: string): boolean {
  return varType.endsWith('[]');
}

export function arrayBaseType(varType: string): string {
  return varType.slice(0, -2);
}

export function arrayOfType(baseType: string): string {
  return `${baseType}[]`;
}

const INDEXED_REF_PATTERN = /^([A-Za-z_$][A-Za-z0-9_$]*)\[(.*)\]$/;

// "arr[i]" -> { name: 'arr', index: 'i' }; null for anything not shaped like
// an indexed reference (a plain variable name, or an arbitrary expression).
export function parseIndexedRef(ref: string): { name: string; index: string } | null {
  const match = ref.match(INDEXED_REF_PATTERN);
  return match ? { name: match[1], index: match[2] } : null;
}

export function indexedRef(name: string, index: string): string {
  return `${name}[${index}]`;
}
