import { isDeclarationLine } from './declarationParser';

// Recognizes simple one-line statements (e.g. `System.out.println(a);`) so
// they can round-trip to/from a Process block. Multi-line constructs
// (for/while/if and their braces) aren't attributed to any node — only
// their skeleton lines are skipped here so they aren't misread as ad-hoc
// statements. Same reliable-subset tradeoff as declarationParser.ts.
const BLOCK_KEYWORD_PATTERN = /^(for|while|if)\b/;

export function parseStatements(code: string): string[] {
  const statements: string[] = [];

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;
    if (line.endsWith('{') || line === '}') continue;
    if (BLOCK_KEYWORD_PATTERN.test(line)) continue;
    if (!line.endsWith(';')) continue;
    if (isDeclarationLine(rawLine)) continue;

    statements.push(line.slice(0, -1).trim());
  }

  return statements;
}
