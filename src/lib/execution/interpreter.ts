// A small tree-walking interpreter for the beginner Java subset Koudo
// teaches: variable declarations, println, assignment/increment, and
// classic counting for-loops. See CLAUDE.md > Execution Engine Decision —
// this is not a Java parser, just enough grammar to make the Play button's
// output real instead of mocked.

export interface RunResult {
  output: string[];
  error: string | null;
}

// ---- Tokenizer -------------------------------------------------------

type TokenType =
  | 'number'
  | 'string'
  | 'identifier'
  | 'keyword'
  | 'punct'
  | 'eof';

interface Token {
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
  'println',
  'true',
  'false',
]);

// Longest-first so e.g. `<=` isn't tokenized as `<` then `=`.
const PUNCTUATORS = [
  '++', '--', '+=', '-=', '*=', '/=', '==', '!=', '<=', '>=', '&&', '||',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '(', ')', '{', '}', ';', ',', '.',
];

class TokenizeError extends Error {}

function tokenize(source: string): Token[] {
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

// ---- AST ---------------------------------------------------------------

type VarKind = 'int' | 'double' | 'float' | 'boolean' | 'String';

type Expr =
  | { kind: 'number'; value: number; isInt: boolean; line: number }
  | { kind: 'string'; value: string; line: number }
  | { kind: 'boolean'; value: boolean; line: number }
  | { kind: 'identifier'; name: string; line: number }
  | { kind: 'unary'; op: '-' | '!'; operand: Expr; line: number }
  | { kind: 'binary'; op: string; left: Expr; right: Expr; line: number };

type Stmt =
  | { kind: 'varDecl'; varType: VarKind; name: string; init: Expr; line: number }
  | { kind: 'assign'; name: string; op: '=' | '+=' | '-=' | '*=' | '/='; value: Expr; line: number }
  | { kind: 'update'; name: string; op: '++' | '--'; line: number }
  | { kind: 'print'; arg: Expr | null; line: number }
  | { kind: 'for'; init: Stmt | null; test: Expr | null; update: Stmt | null; body: Stmt[]; line: number }
  | { kind: 'if'; test: Expr; then: Stmt; else: Stmt | null; line: number }
  | { kind: 'block'; body: Stmt[]; line: number };

class ParseError extends Error {}

const TYPE_KEYWORDS = new Set(['int', 'double', 'float', 'boolean', 'String']);

// ---- Parser (recursive descent) ----------------------------------------

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private check(type: TokenType, value?: string): boolean {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }

  private expect(type: TokenType, value?: string): Token {
    if (!this.check(type, value)) {
      const t = this.peek();
      throw new ParseError(`Expected '${value ?? type}' but found '${t.value || 'end of code'}' on line ${t.line}`);
    }
    return this.next();
  }

  parseProgram(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.check('eof')) statements.push(this.parseStatement());
    return statements;
  }

  private parseStatement(): Stmt {
    const t = this.peek();

    if (t.type === 'keyword' && TYPE_KEYWORDS.has(t.value)) {
      const stmt = this.parseVarDecl();
      this.expect('punct', ';');
      return stmt;
    }
    if (t.type === 'keyword' && t.value === 'for') return this.parseFor();
    if (t.type === 'keyword' && t.value === 'if') return this.parseIf();
    if (t.type === 'keyword' && t.value === 'System') {
      const stmt = this.parsePrint();
      this.expect('punct', ';');
      return stmt;
    }
    if (t.type === 'punct' && t.value === '{') return this.parseBlock();
    if (t.type === 'identifier') {
      const stmt = this.parseExprStatement();
      this.expect('punct', ';');
      return stmt;
    }

    throw new ParseError(`Unexpected token '${t.value || 'end of code'}' on line ${t.line}`);
  }

  private parseVarDecl(): Stmt {
    const typeTok = this.next();
    const nameTok = this.expect('identifier');
    this.expect('punct', '=');
    const init = this.parseExpression();
    return { kind: 'varDecl', varType: typeTok.value as VarKind, name: nameTok.value, init, line: typeTok.line };
  }

  private parseExprStatement(): Stmt {
    const nameTok = this.expect('identifier');
    const opTok = this.peek();

    if (opTok.type === 'punct' && (opTok.value === '++' || opTok.value === '--')) {
      this.next();
      return { kind: 'update', name: nameTok.value, op: opTok.value, line: nameTok.line };
    }
    if (opTok.type === 'punct' && ['=', '+=', '-=', '*=', '/='].includes(opTok.value)) {
      this.next();
      const value = this.parseExpression();
      return { kind: 'assign', name: nameTok.value, op: opTok.value as '=' | '+=' | '-=' | '*=' | '/=', value, line: nameTok.line };
    }

    throw new ParseError(`Expected an assignment or ++/-- after '${nameTok.value}' on line ${nameTok.line}`);
  }

  private parsePrint(): Stmt {
    const startTok = this.next(); // System
    this.expect('punct', '.');
    this.expect('keyword', 'out');
    this.expect('punct', '.');
    this.expect('keyword', 'println');
    this.expect('punct', '(');
    const arg = this.check('punct', ')') ? null : this.parseExpression();
    this.expect('punct', ')');
    return { kind: 'print', arg, line: startTok.line };
  }

  private parseFor(): Stmt {
    const startTok = this.next(); // for
    this.expect('punct', '(');

    const init = this.check('punct', ';')
      ? null
      : this.check('keyword') && TYPE_KEYWORDS.has(this.peek().value)
        ? this.parseVarDecl()
        : this.parseExprStatement();
    this.expect('punct', ';');

    const test = this.check('punct', ';') ? null : this.parseExpression();
    this.expect('punct', ';');

    const update = this.check('punct', ')') ? null : this.parseExprStatement();
    this.expect('punct', ')');

    const bodyStmt = this.parseStatement();
    const body = bodyStmt.kind === 'block' ? bodyStmt.body : [bodyStmt];

    return { kind: 'for', init, test, update, body, line: startTok.line };
  }

  private parseIf(): Stmt {
    const startTok = this.next(); // if
    this.expect('punct', '(');
    const test = this.parseExpression();
    this.expect('punct', ')');
    const thenBranch = this.parseStatement();

    let elseBranch: Stmt | null = null;
    if (this.check('keyword', 'else')) {
      this.next();
      elseBranch = this.parseStatement(); // recursing here lets `else if (...)` fall out for free
    }

    return { kind: 'if', test, then: thenBranch, else: elseBranch, line: startTok.line };
  }

  private parseBlock(): Stmt {
    const startTok = this.expect('punct', '{');
    const body: Stmt[] = [];
    while (!this.check('punct', '}')) {
      if (this.check('eof')) throw new ParseError(`Missing closing '}' for block opened on line ${startTok.line}`);
      body.push(this.parseStatement());
    }
    this.expect('punct', '}');
    return { kind: 'block', body, line: startTok.line };
  }

  // Precedence, low to high: || && equality relational additive multiplicative unary primary
  private parseExpression(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.check('punct', '||')) {
      const op = this.next();
      left = { kind: 'binary', op: op.value, left, right: this.parseAnd(), line: op.line };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseEquality();
    while (this.check('punct', '&&')) {
      const op = this.next();
      left = { kind: 'binary', op: op.value, left, right: this.parseEquality(), line: op.line };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseRelational();
    while (this.check('punct', '==') || this.check('punct', '!=')) {
      const op = this.next();
      left = { kind: 'binary', op: op.value, left, right: this.parseRelational(), line: op.line };
    }
    return left;
  }

  private parseRelational(): Expr {
    let left = this.parseAdditive();
    while (['<', '<=', '>', '>='].some((o) => this.check('punct', o))) {
      const op = this.next();
      left = { kind: 'binary', op: op.value, left, right: this.parseAdditive(), line: op.line };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check('punct', '+') || this.check('punct', '-')) {
      const op = this.next();
      left = { kind: 'binary', op: op.value, left, right: this.parseMultiplicative(), line: op.line };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (['*', '/', '%'].some((o) => this.check('punct', o))) {
      const op = this.next();
      left = { kind: 'binary', op: op.value, left, right: this.parseUnary(), line: op.line };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.check('punct', '-') || this.check('punct', '!')) {
      const op = this.next();
      return { kind: 'unary', op: op.value as '-' | '!', operand: this.parseUnary(), line: op.line };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const t = this.peek();

    if (t.type === 'number') {
      this.next();
      return { kind: 'number', value: Number(t.value), isInt: !t.value.includes('.'), line: t.line };
    }
    if (t.type === 'string') {
      this.next();
      return { kind: 'string', value: t.value, line: t.line };
    }
    if (t.type === 'keyword' && (t.value === 'true' || t.value === 'false')) {
      this.next();
      return { kind: 'boolean', value: t.value === 'true', line: t.line };
    }
    if (t.type === 'identifier') {
      this.next();
      return { kind: 'identifier', name: t.value, line: t.line };
    }
    if (t.type === 'punct' && t.value === '(') {
      this.next();
      const expr = this.parseExpression();
      this.expect('punct', ')');
      return expr;
    }

    throw new ParseError(`Unexpected token '${t.value || 'end of code'}' on line ${t.line}`);
  }
}

// ---- Interpreter ---------------------------------------------------------

// A value plus the declared/inferred Java type it carries. Kind is tracked
// through evaluation (not just storage) so `int / int` truncates like Java
// even when neither operand is ever assigned to a variable — e.g.
// `System.out.println(7 / 2)` must print "3", not "3.5".
interface EvalValue {
  kind: VarKind;
  value: number | string | boolean;
}

type VarSlot = EvalValue;

class RuntimeError extends Error {}

const MAX_STEPS = 200_000;
const MAX_OUTPUT_LINES = 5_000;

class Interpreter {
  private scopes: Map<string, VarSlot>[] = [new Map()];
  private output: string[] = [];
  private steps = 0;

  run(program: Stmt[]): string[] {
    this.execBlock(program);
    return this.output;
  }

  // Whatever printed before a runtime error hit, so a mistake partway
  // through a loop doesn't erase everything that ran successfully.
  getOutput(): string[] {
    return this.output;
  }

  private tick(line: number) {
    this.steps++;
    if (this.steps > MAX_STEPS) {
      throw new RuntimeError(`Stopped after ${MAX_STEPS.toLocaleString()} steps — possible infinite loop near line ${line}.`);
    }
  }

  private pushScope() {
    this.scopes.push(new Map());
  }

  private popScope() {
    this.scopes.pop();
  }

  private declare(name: string, slot: VarSlot, line: number) {
    const top = this.scopes[this.scopes.length - 1];
    if (top.has(name)) throw new RuntimeError(`Variable '${name}' is already declared on line ${line}.`);
    top.set(name, slot);
  }

  private lookup(name: string, line: number): VarSlot {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const slot = this.scopes[i].get(name);
      if (slot) return slot;
    }
    throw new RuntimeError(`Variable '${name}' is not declared (line ${line}).`);
  }

  private execBlock(statements: Stmt[]) {
    for (const stmt of statements) this.execStmt(stmt);
  }

  private execStmt(stmt: Stmt) {
    this.tick(stmt.line);

    switch (stmt.kind) {
      case 'varDecl': {
        const value = coerceToKind(this.evalExpr(stmt.init).value, stmt.varType);
        this.declare(stmt.name, { kind: stmt.varType, value }, stmt.line);
        return;
      }
      case 'assign': {
        const slot = this.lookup(stmt.name, stmt.line);
        const rhs = this.evalExpr(stmt.value);
        const next = stmt.op === '=' ? rhs : applyBinaryOp(stmt.op[0], slot, rhs, stmt.line);
        slot.value = coerceToKind(next.value, slot.kind);
        return;
      }
      case 'update': {
        const slot = this.lookup(stmt.name, stmt.line);
        const delta: EvalValue = { kind: 'int', value: stmt.op === '++' ? 1 : -1 };
        slot.value = coerceToKind(applyBinaryOp('+', slot, delta, stmt.line).value, slot.kind);
        return;
      }
      case 'print': {
        const value = stmt.arg ? formatValue(this.evalExpr(stmt.arg)) : '';
        this.output.push(value);
        if (this.output.length > MAX_OUTPUT_LINES) {
          throw new RuntimeError(`Stopped after ${MAX_OUTPUT_LINES.toLocaleString()} lines of output.`);
        }
        return;
      }
      case 'block': {
        this.pushScope();
        this.execBlock(stmt.body);
        this.popScope();
        return;
      }
      case 'for': {
        this.pushScope();
        if (stmt.init) this.execStmt(stmt.init);
        while (stmt.test ? Boolean(this.evalExpr(stmt.test).value) : true) {
          this.tick(stmt.line);
          this.pushScope();
          this.execBlock(stmt.body);
          this.popScope();
          if (stmt.update) this.execStmt(stmt.update);
        }
        this.popScope();
        return;
      }
      case 'if': {
        if (Boolean(this.evalExpr(stmt.test).value)) {
          this.execStmt(stmt.then);
        } else if (stmt.else) {
          this.execStmt(stmt.else);
        }
        return;
      }
    }
  }

  private evalExpr(expr: Expr): EvalValue {
    switch (expr.kind) {
      case 'number':
        return { kind: expr.isInt ? 'int' : 'double', value: expr.value };
      case 'string':
        return { kind: 'String', value: expr.value };
      case 'boolean':
        return { kind: 'boolean', value: expr.value };
      case 'identifier':
        return this.lookup(expr.name, expr.line);
      case 'unary': {
        const operand = this.evalExpr(expr.operand);
        if (expr.op === '-') return { kind: operand.kind, value: -Number(operand.value) };
        return { kind: 'boolean', value: !operand.value };
      }
      case 'binary': {
        const left = this.evalExpr(expr.left);
        const right = this.evalExpr(expr.right);
        return applyBinaryOp(expr.op, left, right, expr.line);
      }
    }
  }
}

function coerceToKind(value: number | string | boolean, kind: VarKind): number | string | boolean {
  if (kind === 'int') return Math.trunc(Number(value));
  if (kind === 'double' || kind === 'float') return Number(value);
  if (kind === 'boolean') return Boolean(value);
  return String(value);
}

// Mirrors Java's println/string-concat formatting for whole-number
// doubles/floats (`3.0`, not `3`) — otherwise `double c = 6.0;` would print
// "6" and look indistinguishable from an int to a beginner.
function formatValue(ev: EvalValue): string {
  if ((ev.kind === 'double' || ev.kind === 'float') && Number.isInteger(ev.value as number)) {
    return `${ev.value}.0`;
  }
  return String(ev.value);
}

function applyBinaryOp(op: string, left: EvalValue, right: EvalValue, line: number): EvalValue {
  if (op === '+' && (left.kind === 'String' || right.kind === 'String')) {
    return { kind: 'String', value: `${formatValue(left)}${formatValue(right)}` };
  }

  switch (op) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '%': {
      const bothInt = left.kind === 'int' && right.kind === 'int';
      const l = Number(left.value);
      const r = Number(right.value);
      if ((op === '/' || op === '%') && r === 0) throw new RuntimeError(`Division by zero on line ${line}.`);

      let result: number;
      switch (op) {
        case '+':
          result = l + r;
          break;
        case '-':
          result = l - r;
          break;
        case '*':
          result = l * r;
          break;
        case '/':
          result = bothInt ? Math.trunc(l / r) : l / r;
          break;
        case '%':
          result = l % r;
          break;
      }
      return { kind: bothInt ? 'int' : 'double', value: result };
    }
    case '<':
      return { kind: 'boolean', value: Number(left.value) < Number(right.value) };
    case '<=':
      return { kind: 'boolean', value: Number(left.value) <= Number(right.value) };
    case '>':
      return { kind: 'boolean', value: Number(left.value) > Number(right.value) };
    case '>=':
      return { kind: 'boolean', value: Number(left.value) >= Number(right.value) };
    case '==':
      return { kind: 'boolean', value: left.value === right.value };
    case '!=':
      return { kind: 'boolean', value: left.value !== right.value };
    case '&&':
      return { kind: 'boolean', value: Boolean(left.value) && Boolean(right.value) };
    case '||':
      return { kind: 'boolean', value: Boolean(left.value) || Boolean(right.value) };
    default:
      throw new RuntimeError(`Unsupported operator '${op}' on line ${line}.`);
  }
}

export function runJava(code: string): RunResult {
  let interpreter: Interpreter | null = null;
  try {
    const tokens = tokenize(code);
    const program = new Parser(tokens).parseProgram();
    interpreter = new Interpreter();
    const output = interpreter.run(program);
    return { output, error: null };
  } catch (err) {
    if (err instanceof TokenizeError || err instanceof ParseError || err instanceof RuntimeError) {
      return { output: interpreter?.getOutput() ?? [], error: err.message };
    }
    throw err;
  }
}
