// Recursive-descent parser + AST for the beginner Java subset Koudo teaches
// — see interpreter.ts for the overall picture (this is not a real Java
// parser).

import type { Token, TokenType } from './tokenizer';

export type VarKind = 'int' | 'double' | 'float' | 'boolean' | 'String';

export type Expr =
  | { kind: 'number'; value: number; isInt: boolean; line: number }
  | { kind: 'string'; value: string; line: number }
  | { kind: 'boolean'; value: boolean; line: number }
  | { kind: 'identifier'; name: string; line: number }
  | { kind: 'unary'; op: '-' | '!'; operand: Expr; line: number }
  | { kind: 'binary'; op: string; left: Expr; right: Expr; line: number }
  | { kind: 'scannerRead'; method: string; line: number };

export type Stmt =
  | { kind: 'varDecl'; varType: VarKind; name: string; init: Expr; line: number }
  | { kind: 'assign'; name: string; op: '=' | '+=' | '-=' | '*=' | '/='; value: Expr; line: number }
  | { kind: 'update'; name: string; op: '++' | '--'; line: number }
  | { kind: 'print'; arg: Expr | null; newline: boolean; line: number }
  | { kind: 'for'; init: Stmt | null; test: Expr | null; update: Stmt | null; body: Stmt[]; line: number }
  | { kind: 'if'; test: Expr; then: Stmt; else: Stmt | null; line: number }
  | { kind: 'block'; body: Stmt[]; line: number }
  // A `Scanner sc = new Scanner(System.in);` declaration — this interpreter
  // doesn't model a real Scanner object, so it's parsed just to accept the
  // idiomatic Java and then does nothing; the actual reads happen at each
  // `<ident>.nextInt()`-shaped expression (see scannerRead).
  | { kind: 'noop'; line: number };

export class ParseError extends Error {}

const TYPE_KEYWORDS = new Set(['int', 'double', 'float', 'boolean', 'String']);

// Recognized as `<anyIdentifier>.<methodName>()` inside an expression (see
// parsePrimary) — the identifier itself is never checked against a real
// Scanner binding, since this interpreter doesn't model objects/methods in
// general. Only these specific method names, called with no arguments,
// trigger a (synchronous, via window.prompt) read from the user.
const SCANNER_METHODS = new Set(['nextInt', 'nextDouble', 'nextBoolean', 'nextLine', 'next']);

export class Parser {
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

  // A Decision block's condition (e.g. "a > 5") isn't a statement — none of
  // parseStatement's shapes (var decl, assignment, print, ...) accept a bare
  // expression — so the step runner (see createStepInterpreter) parses it
  // through here instead of parseProgram.
  parseStandaloneExpression(): Expr {
    const expr = this.parseExpression();
    this.expect('eof');
    return expr;
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
    if (t.type === 'keyword' && t.value === 'Scanner') {
      const stmt = this.parseScannerDecl();
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
    const methodTok = this.peek();
    if (!(methodTok.type === 'keyword' && (methodTok.value === 'println' || methodTok.value === 'print'))) {
      throw new ParseError(`Expected 'print' or 'println' but found '${methodTok.value || 'end of code'}' on line ${methodTok.line}`);
    }
    this.next();
    this.expect('punct', '(');
    const arg = this.check('punct', ')') ? null : this.parseExpression();
    this.expect('punct', ')');
    return { kind: 'print', arg, newline: methodTok.value === 'println', line: startTok.line };
  }

  // `Scanner sc = new Scanner(System.in);` — parsed and discarded (see the
  // `noop` Stmt kind's comment for why). The variable name isn't even kept;
  // reads are recognized purely by method name at the call site.
  private parseScannerDecl(): Stmt {
    const startTok = this.next(); // Scanner
    this.expect('identifier');
    this.expect('punct', '=');
    this.expect('keyword', 'new');
    this.expect('keyword', 'Scanner');
    this.expect('punct', '(');
    this.expect('keyword', 'System');
    this.expect('punct', '.');
    this.expect('keyword', 'in');
    this.expect('punct', ')');
    return { kind: 'noop', line: startTok.line };
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
      // `<anyIdentifier>.nextInt()` etc. — the identifier isn't checked
      // against any real Scanner binding (see SCANNER_METHODS' comment);
      // only the method name and empty-argument-list matter.
      if (this.check('punct', '.') && this.peek(1).type === 'identifier' && SCANNER_METHODS.has(this.peek(1).value)) {
        this.next(); // '.'
        const methodTok = this.next(); // method name
        this.expect('punct', '(');
        this.expect('punct', ')');
        return { kind: 'scannerRead', method: methodTok.value, line: t.line };
      }
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
