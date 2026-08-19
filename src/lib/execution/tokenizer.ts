// Tokenizer for the beginner Java subset Koudo teaches — see interpreter.ts
// for the overall picture (this is not a real Java parser/tokenizer).

export type TokenType =
  | 'number'
  | 'string'
  | 'identifier'
  | 'keyword'
  | 'punct'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

const KEYWORDS = new Set([
  'int',
  'double',
  'float',
  'boolean',
  'String',
  'for',
  'if',
  'else',
  'System',
  'out',
  'in',
  'print',
  'println',
  'true',
  'false',
  'Scanner',
  'new',
]);

// Longest-first so e.g. `<=` isn't tokenized as `<` then `=`.
const PUNCTUATORS = [
  '++', '--', '+=', '-=', '*=', '/=', '==', '!=', '<=', '>=', '&&', '||',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '(', ')', '{', '}', ';', ',', '.',
];

export class TokenizeError extends Error {}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;

  while (i < source.length) {
    const ch = source[i];

    if (ch === '\n') {
      line++;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (ch === '"') {
      let value = '';
      const startLine = line;
      i++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') {
          const next = source[i + 1];
          value += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          value += source[i];
          i++;
        }
      }
      if (source[i] !== '"') throw new TokenizeError(`Unterminated string literal on line ${startLine}`);
      i++;
      tokens.push({ type: 'string', value, line: startLine });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let value = '';
      const startLine = line;
      while (i < source.length && /[0-9.]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({ type: 'number', value, line: startLine });
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let value = '';
      const startLine = line;
      while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({ type: KEYWORDS.has(value) ? 'keyword' : 'identifier', value, line: startLine });
      continue;
    }

    const punct = PUNCTUATORS.find((p) => source.startsWith(p, i));
    if (punct) {
      tokens.push({ type: 'punct', value: punct, line });
      i += punct.length;
      continue;
    }

    throw new TokenizeError(`Unexpected character '${ch}' on line ${line}`);
  }

  tokens.push({ type: 'eof', value: '', line });
  return tokens;
}
