// codeContent (see stores/code.ts) is only ever the method body — the
// in-browser interpreter (lib/execution/interpreter.ts) runs statements
// directly and has no notion of a class or a `main` entry point, and a
// Scanner-using flowchart's generated body references `new Scanner(...)`
// (see generator.ts) without importing it, since that interpreter doesn't
// need a real import either. A real, compilable .java file needs both — a
// class wrapper and, if used, the Scanner import.
const USES_SCANNER_PATTERN = /\bnew Scanner\(/;
const BODY_INDENT = '        ';

// Java requires the public class name to match its filename, and reads
// better matching the project name than a fixed "Main" — so the project
// name (free-typed, see stores/project.ts) has to become a valid Java
// identifier: only letters/digits survive (each word capitalized, so
// spaces/punctuation don't just vanish into a run-together mess), and a
// name with no letters/digits at all (or one that's only digits, which
// Java identifiers can't start with) falls back to "Main".
export function sanitizeJavaClassName(name: string): string {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  const identifier = words.map((word) => word[0].toUpperCase() + word.slice(1)).join('');
  return identifier.replace(/^[0-9]+/, '') || 'Main';
}

export function wrapAsJavaFile(code: string, className: string): string {
  const body = code
    .trim()
    .split('\n')
    .map((line) => (line ? `${BODY_INDENT}${line}` : ''))
    .join('\n');
  const importLine = USES_SCANNER_PATTERN.test(code) ? 'import java.util.Scanner;\n\n' : '';

  return `${importLine}public class ${className} {\n    public static void main(String[] args) {\n${body}\n    }\n}\n`;
}
