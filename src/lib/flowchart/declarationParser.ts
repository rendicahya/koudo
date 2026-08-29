export interface ParsedDeclaration {
  varType: string;
  varName: string;
  varValue: string;
}

const DECLARATION_TYPES = ['int', 'long', 'double', 'float', 'boolean', 'char', 'String'];

// Reserved words a beginner might plausibly type as a variable name — not
// the full Java keyword list, just the ones likely to show up here.
const JAVA_RESERVED_WORDS = new Set([
  'int', 'double', 'float', 'boolean', 'String', 'char', 'long', 'short', 'byte', 'void',
  'class', 'interface', 'enum', 'extends', 'implements', 'public', 'private', 'protected',
  'static', 'final', 'abstract', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
  'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'import',
  'package', 'this', 'super', 'null', 'true', 'false', 'instanceof', 'synchronized', 'volatile',
  'transient', 'native', 'strictfp', 'assert', 'const', 'goto', 'System',
]);

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function isValidJavaIdentifier(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && IDENTIFIER_PATTERN.test(trimmed) && !JAVA_RESERVED_WORDS.has(trimmed);
}

// One statement per line, no semicolons inside the value (e.g. inside a
// string literal) — a narrow, reliable subset rather than a real Java
// tokenizer. See CLAUDE.md > Execution Engine Decision for the same
// reliable-subset-over-general-parser tradeoff. The `= value` part is
// optional (group 3 is undefined without it) — a Declare block's value
// field can be left blank (see DeclareNode.svelte), generating a bare
// `int a;` with no initializer. The optional `(\[\])?` right after the type
// (group 2) recognizes an array declaration (`int[] a = {1, 2, 3};`) — see
// lib/flowchart/arrayType.ts, whose "[]"-suffixed varType convention this
// folds the capture into.
const DECLARATION_PATTERN = new RegExp(
  `^\\s*(${DECLARATION_TYPES.join('|')})(\\[\\])?\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*(?:=\\s*(.+?))?;\\s*$`,
);

export function isDeclarationLine(line: string): boolean {
  return DECLARATION_PATTERN.test(line);
}

export function parseDeclarations(code: string): ParsedDeclaration[] {
  const declarations: ParsedDeclaration[] = [];

  for (const line of code.split('\n')) {
    const match = line.match(DECLARATION_PATTERN);
    if (!match) continue;

    const [, baseType, arraySuffix, varName, varValue] = match;
    const varType = `${baseType}${arraySuffix ?? ''}`;
    const existingIndex = declarations.findIndex((d) => d.varName === varName);
    if (existingIndex !== -1) declarations.splice(existingIndex, 1);
    declarations.push({ varType, varName, varValue: (varValue ?? '').trim() });
  }

  return declarations;
}
