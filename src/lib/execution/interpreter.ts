// A small tree-walking interpreter for the beginner Java subset Koudo
// teaches: variable declarations, println, assignment/increment, and
// classic counting for-loops. See CLAUDE.md > Execution Engine Decision —
// this is not a Java parser, just enough grammar to make the Play button's
// output real instead of mocked.
//
// Split across three files: tokenizer.ts (source text -> tokens),
// parser.ts (tokens -> AST, via recursive descent), and this file (AST ->
// output, by walking it).

import { tokenize, TokenizeError } from './tokenizer';
import { Parser, ParseError, type Expr, type Stmt, type VarKind } from './parser';

export interface RunResult {
  output: string[];
  error: string | null;
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

// Requests one line of input from the user. Backed by window.prompt() by
// default — it's synchronous/blocking, which is exactly what this
// synchronous tree-walking interpreter needs, with no async rewrite.
// Injectable so the interpreter itself stays testable outside a browser.
export type PromptFn = (message: string) => string | null;

function defaultPrompt(message: string): string | null {
  return typeof window !== 'undefined' && typeof window.prompt === 'function' ? window.prompt(message) : null;
}

class Interpreter {
  private scopes: Map<string, VarSlot>[] = [new Map()];
  private output: string[] = [];
  // Accumulates System.out.print() text (no newline) until the next
  // println, program end, or error flushes it into `output` as a line —
  // print() on its own doesn't start a new output line the way println()
  // does.
  private pendingLine = '';
  private steps = 0;

  constructor(private promptFn: PromptFn) {}

  run(program: Stmt[]): string[] {
    this.execBlock(program);
    this.flushPending();
    return this.output;
  }

  // Whatever printed before a runtime error hit, so a mistake partway
  // through a loop doesn't erase everything that ran successfully.
  getOutput(): string[] {
    this.flushPending();
    return this.output;
  }

  // Runs a handful of top-level statements (one flowchart node's worth —
  // see createStepInterpreter) against this interpreter's *existing* scope,
  // instead of run()'s fresh one — so a Declare block's step and an Assign
  // block's step later on see the same variables.
  runMore(statements: Stmt[]) {
    this.execBlock(statements);
  }

  // Evaluates a Decision block's condition against this interpreter's live
  // scope, same as an `if (...)` test would mid-program.
  evalCondition(expr: Expr): boolean {
    return Boolean(this.evalExpr(expr).value);
  }

  // Every variable currently in scope, for the step runner's Variable
  // Watcher (see stores/stepRunner.ts) — merged outer-to-inner so a shadowed
  // outer variable never masks the one actually in effect. In practice a
  // stepped run never pushes past the single top-level scope (see runMore's
  // comment), but this stays correct if that ever changes.
  getVariables(): { name: string; kind: VarKind; value: string }[] {
    const merged = new Map<string, VarSlot>();
    for (const scope of this.scopes) {
      for (const [name, slot] of scope) merged.set(name, slot);
    }
    return [...merged.entries()].map(([name, slot]) => ({ name, kind: slot.kind, value: formatValue(slot) }));
  }

  private flushPending() {
    if (!this.pendingLine) return;
    this.output.push(this.pendingLine);
    this.pendingLine = '';
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
        this.pendingLine += value;
        if (stmt.newline) {
          this.output.push(this.pendingLine);
          this.pendingLine = '';
        }
        if (this.output.length > MAX_OUTPUT_LINES) {
          throw new RuntimeError(`Stopped after ${MAX_OUTPUT_LINES.toLocaleString()} lines of output.`);
        }
        return;
      }
      case 'noop':
        return;
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
      case 'scannerRead': {
        // Whatever's printed so far (e.g. a prompt via System.out.print)
        // should show up before the native input dialog, not get stuck
        // behind it in a still-pending line.
        this.flushPending();
        return readFromUser(this.promptFn, expr.method, expr.line);
      }
    }
  }
}

function readFromUser(promptFn: PromptFn, method: string, line: number): EvalValue {
  const raw = promptFn('Program is waiting for input:');
  if (raw === null) throw new RuntimeError(`Input was cancelled (line ${line}).`);

  switch (method) {
    case 'nextInt': {
      const n = Number(raw.trim());
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new RuntimeError(`Expected a whole number but got '${raw}' (line ${line}).`);
      }
      return { kind: 'int', value: n };
    }
    case 'nextDouble': {
      const n = Number(raw.trim());
      if (!Number.isFinite(n)) throw new RuntimeError(`Expected a number but got '${raw}' (line ${line}).`);
      return { kind: 'double', value: n };
    }
    case 'nextBoolean': {
      const v = raw.trim().toLowerCase();
      if (v !== 'true' && v !== 'false') {
        throw new RuntimeError(`Expected true or false but got '${raw}' (line ${line}).`);
      }
      return { kind: 'boolean', value: v === 'true' };
    }
    case 'nextLine':
    case 'next':
    default:
      return { kind: 'String', value: raw };
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

// Powers the flowchart's step-by-step runner (see stores/stepRunner.ts):
// one persistent Interpreter, fed one node's worth of Java text at a time
// (a Declare/Assign/Process/Input block's generated statement(s), or a
// Decision block's condition) instead of a whole program at once, so
// variables declared by an earlier step are still in scope for a later one.
export interface StepInterpreter {
  /** Runs one node's generated statement(s) (e.g. "int a = 1;"). Throws (TokenizeError/ParseError/RuntimeError) on bad code. */
  runStatements(code: string): void;
  /** Evaluates a Decision node's condition text (e.g. "a > 5"). Throws the same way. */
  evalCondition(code: string): boolean;
  /** Everything printed by every runStatements() call so far on this interpreter. */
  getOutput(): string[];
  /** Every variable currently in scope — name, declared type, and formatted current value. */
  getVariables(): { name: string; type: string; value: string }[];
}

export function createStepInterpreter(promptFn: PromptFn = defaultPrompt): StepInterpreter {
  const interpreter = new Interpreter(promptFn);
  return {
    runStatements(code: string) {
      const program = new Parser(tokenize(code)).parseProgram();
      interpreter.runMore(program);
    },
    evalCondition(code: string) {
      const expr = new Parser(tokenize(code)).parseStandaloneExpression();
      return interpreter.evalCondition(expr);
    },
    getOutput() {
      return interpreter.getOutput();
    },
    getVariables() {
      return interpreter.getVariables().map(({ name, kind, value }) => ({ name, type: kind, value }));
    },
  };
}

export function runJava(code: string, promptFn: PromptFn = defaultPrompt): RunResult {
  let interpreter: Interpreter | null = null;
  try {
    const tokens = tokenize(code);
    const program = new Parser(tokens).parseProgram();
    interpreter = new Interpreter(promptFn);
    const output = interpreter.run(program);
    return { output, error: null };
  } catch (err) {
    if (err instanceof TokenizeError || err instanceof ParseError || err instanceof RuntimeError) {
      return { output: interpreter?.getOutput() ?? [], error: err.message };
    }
    throw err;
  }
}
