// A Declare block's String/char entries are edited unquoted in the UI (see
// DeclareNode.svelte's quote-mark decoration) — these two functions are the
// only place that quoting is added back for generated Java (formatDeclaredValue)
// or stripped off when code typed/pasted directly into the editor syncs back
// into a Declare entry (unquoteDeclaredValue, used by stores/sync.ts).

import { arrayBaseType, isArrayType } from './arrayType';

function escapeJavaChar(text: string, quote: string): string {
  return text.replace(/\\/g, '\\\\').split(quote).join(`\\${quote}`);
}

// An array entry's value field is overloaded, the same free-text-with-a-
// convention pattern ForLoop's init/condition/update fields already use: a
// bare whole number means "size" (`new int[5]`, every element defaulting to
// its type's zero value), anything else is read as a comma-separated list of
// element literals (`{1, 2, 3}`), each formatted per the element type —
// including nested String/char quoting, via the same formatDeclaredValue
// this is a branch of.
function formatArrayValue(varType: string, rawValue: string): string {
  const base = arrayBaseType(varType);
  const trimmed = rawValue.trim();
  if (/^\d+$/.test(trimmed)) return `new ${base}[${trimmed}]`;
  if (!trimmed) return `{}`;
  const elements = trimmed.split(',').map((element) => formatDeclaredValue(base, element.trim()));
  return `{${elements.join(', ')}}`;
}

export function formatDeclaredValue(varType: string, rawValue: string): string {
  if (isArrayType(varType)) return formatArrayValue(varType, rawValue);
  if (varType === 'String') return `"${escapeJavaChar(rawValue, '"')}"`;
  if (varType === 'char') return `'${escapeJavaChar(rawValue, "'")}'`;
  return rawValue;
}

export function unquoteDeclaredValue(varType: string, javaValue: string): string {
  const trimmed = javaValue.trim();
  if (varType === 'String' && trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  if (varType === 'char' && trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return trimmed;
}
