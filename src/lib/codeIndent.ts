import type { CodeIndentStyle } from '../stores/layout';

// generator.ts and generatorPseudocode.ts both build up nesting with a
// fixed 4-space step per level (see their own indent() helpers), and
// exportJava.ts's class/method wrapper follows the same step (BODY_INDENT
// is exactly two of them). Converting that fixed output to the user's
// chosen indent style (see stores/layout.ts's codeIndentStyle) only needs
// to know how many 4-space steps led each line — the content is never
// touched, just how many characters of leading whitespace represent it.
export function reindent(code: string, style: CodeIndentStyle): string {
  if (style === '4') return code;

  const unit = style === '2' ? '  ' : '\t';
  return code
    .split('\n')
    .map((line) => {
      const match = line.match(/^( +)/);
      if (!match) return line;
      const spaceCount = match[1].length;
      const levels = Math.floor(spaceCount / 4);
      const remainder = spaceCount % 4;
      return unit.repeat(levels) + ' '.repeat(remainder) + line.slice(spaceCount);
    })
    .join('\n');
}
