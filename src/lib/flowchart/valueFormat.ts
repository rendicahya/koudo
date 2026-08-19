// A Declare block's String/char entries are edited unquoted in the UI (see
// DeclareNode.svelte's quote-mark decoration) — these two functions are the
// only place that quoting is added back for generated Java (formatDeclaredValue)
// or stripped off when code typed/pasted directly into the editor syncs back
// into a Declare entry (unquoteDeclaredValue, used by stores/sync.ts).

function escapeJavaChar(text: string, quote: string): string {
  return text.replace(/\\/g, '\\\\').split(quote).join(`\\${quote}`);
}

export function formatDeclaredValue(varType: string, rawValue: string): string {
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
