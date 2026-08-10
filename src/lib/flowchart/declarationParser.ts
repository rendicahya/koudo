export interface ParsedDeclaration {
  varType: string;
  varName: string;
  varValue: string;
}

const DECLARATION_TYPES = ['int', 'double', 'float', 'boolean', 'String'];

// One statement per line, no semicolons inside the value (e.g. inside a
// string literal) — a narrow, reliable subset rather than a real Java
// tokenizer. See CLAUDE.md > Execution Engine Decision for the same
// reliable-subset-over-general-parser tradeoff.
const DECLARATION_PATTERN = new RegExp(
  `^\\s*(${DECLARATION_TYPES.join('|')})\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.+?);\\s*$`,
);

export function isDeclarationLine(line: string): boolean {
  return DECLARATION_PATTERN.test(line);
}

export function parseDeclarations(code: string): ParsedDeclaration[] {
  const declarations: ParsedDeclaration[] = [];

  for (const line of code.split('\n')) {
    const match = line.match(DECLARATION_PATTERN);
    if (!match) continue;

    const [, varType, varName, varValue] = match;
    const existingIndex = declarations.findIndex((d) => d.varName === varName);
    if (existingIndex !== -1) declarations.splice(existingIndex, 1);
    declarations.push({ varType, varName, varValue: varValue.trim() });
  }

  return declarations;
}
