// codeContent (see stores/code.ts) is only ever the method body — the
// in-browser interpreter (lib/execution/interpreter.ts) runs statements
// directly and has no notion of a class or a `main` entry point, and a
// Scanner-using flowchart's generated body references `new Scanner(...)`
// (see generator.ts) without importing it, since that interpreter doesn't
// need a real import either. A real, compilable .java file needs both — a
// class wrapper and, if used, the Scanner import.
const USES_SCANNER_PATTERN = /\bnew Scanner\(/;
const BODY_INDENT = '        ';

export function wrapAsJavaFile(code: string): string {
  const body = code
    .trim()
    .split('\n')
    .map((line) => (line ? `${BODY_INDENT}${line}` : ''))
    .join('\n');
  const importLine = USES_SCANNER_PATTERN.test(code) ? 'import java.util.Scanner;\n\n' : '';

  return `${importLine}public class Main {\n    public static void main(String[] args) {\n${body}\n    }\n}\n`;
}
