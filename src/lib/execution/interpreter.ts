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

export interface VariableSnapshot {
  name: string;
  type: string;
  value: string;
}

export interface RunResult {
  output: string[];
  error: string | null;
  variables: VariableSnapshot[];
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

type FuncDeclStmt = Extract<Stmt, { kind: 'funcDecl' }>;

// Thrown by a `return` statement to unwind out of whatever nested
// blocks/loops it's inside, back to callFunction — control flow only, never
// surfaced to the user like RuntimeError is (see runJava's catch).
class ReturnSignal {
  constructor(public value: EvalValue | null) {}
}

// A declared variable's storage slot — `initialized` is false for one
// declared without a value (see zeroValueFor); `value` still holds a real
// placeholder even then (so assignment machinery like coerceToKind always
// has something to work with), but *reading* an uninitialized slot is a
// RuntimeError (see the `identifier` case in evalExpr and the compound-
// assign/update cases in execStmt) — it's only ever meant to be written to
// before anything reads it, mirroring Java's own "variable might not have
// been initialized" compile error.
type VarSlot = EvalValue & { initialized: boolean };

class RuntimeError extends Error {}

const MAX_STEPS = 200_000;
const MAX_OUTPUT_LINES = 5_000;
// A real stack overflow (JS's own call stack, not MAX_STEPS) would hit long
// before 200,000 ticks for a runaway recursive Subroutine Call, and throws
// an uncatchable-by-name RangeError instead of this interpreter's own
// RuntimeError — so recursion depth is checked explicitly, well under where
// that would happen.
const MAX_CALL_DEPTH = 300;

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
  // Subroutine Start/End pairs, keyed by method name — populated by
  // registerFunctions before anything runs, so a call earlier in the source
  // text than its declaration (never actually possible from this app's own
  // generator, but harmless to support) still resolves.
  private functions = new Map<string, FuncDeclStmt>();
  private callDepth = 0;

  constructor(private promptFn: PromptFn) {}

  run(program: Stmt[]): string[] {
    const mainStatements = this.registerFunctions(program);
    this.execBlock(mainStatements);
    this.flushPending();
    return this.output;
  }

  // Splits top-level function declarations out from the statements that
  // actually run — see run()'s comment on why declarations are hoisted
  // rather than executed in place.
  private registerFunctions(program: Stmt[]): Stmt[] {
    const rest: Stmt[] = [];
    for (const stmt of program) {
      if (stmt.kind === 'funcDecl') {
        this.functions.set(stmt.name, stmt);
      } else {
        rest.push(stmt);
      }
    }
    return rest;
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
    // Shows the placeholder state plainly rather than its underlying
    // zeroValueFor() value — printing that value would itself be a
    // RuntimeError (see lookupInitialized), so displaying it here as if it
    // were real would be misleading.
    return [...merged.entries()].map(([name, slot]) => ({
      name,
      kind: slot.kind,
      value: slot.initialized ? formatValue(slot) : '(not initialized)',
    }));
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

  // Every place that *reads* a variable's current value (an expression's
  // own identifier reference, or a compound assignment/++/-- that folds the
  // old value into the new one) goes through this instead of lookup() —
  // lookup() alone is still right for a plain `=` assignment's target,
  // which is about to be written to, not read from.
  private lookupInitialized(name: string, line: number): VarSlot {
    const slot = this.lookup(name, line);
    if (!slot.initialized) {
      throw new RuntimeError(`Variable '${name}' might not have been initialized (line ${line}).`);
    }
    return slot;
  }

  private execBlock(statements: Stmt[]) {
    for (const stmt of statements) this.execStmt(stmt);
  }

  private execStmt(stmt: Stmt) {
    this.tick(stmt.line);

    switch (stmt.kind) {
      case 'varDecl': {
        if (stmt.init) {
          const value = coerceToKind(this.evalExpr(stmt.init).value, stmt.varType);
          this.declare(stmt.name, { kind: stmt.varType, value, initialized: true }, stmt.line);
        } else {
          this.declare(stmt.name, { kind: stmt.varType, value: zeroValueFor(stmt.varType), initialized: false }, stmt.line);
        }
        return;
      }
      case 'assign': {
        // A plain `=` overwrites the slot outright, so it's fine as the
        // *first* real value for one declared without an initializer —
        // only a compound op (+=, -=, ...) actually reads the slot's
        // current value first, so only that path requires it already be
        // initialized.
        const slot = this.lookup(stmt.name, stmt.line);
        if (stmt.op !== '=' && !slot.initialized) {
          throw new RuntimeError(`Variable '${stmt.name}' might not have been initialized (line ${stmt.line}).`);
        }
        const rhs = this.evalExpr(stmt.value);
        const next = stmt.op === '=' ? rhs : applyBinaryOp(stmt.op[0], slot, rhs, stmt.line);
        slot.value = coerceToKind(next.value, slot.kind);
        slot.initialized = true;
        return;
      }
      case 'update': {
        // ++/-- always reads the current value before writing the new one.
        const slot = this.lookupInitialized(stmt.name, stmt.line);
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
      case 'while': {
        while (Boolean(this.evalExpr(stmt.test).value)) {
          this.tick(stmt.line);
          this.pushScope();
          this.execBlock(stmt.body);
          this.popScope();
        }
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
      case 'funcDecl':
        // Already registered by run()'s registerFunctions before execution
        // began — nothing to do if one is walked into in place.
        return;
      case 'return':
        throw new ReturnSignal(stmt.value ? this.evalExpr(stmt.value) : null);
      case 'exprStmt': {
        // Only shape exprStmt's expr ever takes (see parser.ts's
        // parseExprStatement) — a call whose result is discarded, so it's
        // run directly rather than through evalExpr (which would reject a
        // void call as unusable).
        const call = stmt.expr as Extract<Expr, { kind: 'call' }>;
        this.callFunction(call.name, call.args, call.line);
        return;
      }
    }
  }

  // Runs a Subroutine Call — a fresh, isolated scope stack (Java's own
  // static methods can't see the caller's locals either), params bound from
  // the (already-evaluated-in-the-caller's-scope) argument values, then the
  // body until it either returns or falls off the end. Returns null for a
  // void method, an EvalValue of the declared return type otherwise.
  private callFunction(name: string, argExprs: Expr[], line: number): EvalValue | null {
    const fn = this.functions.get(name);
    if (!fn) throw new RuntimeError(`Method '${name}' is not declared (line ${line}).`);
    if (fn.params.length !== argExprs.length) {
      throw new RuntimeError(`Method '${name}' expects ${fn.params.length} argument(s) but got ${argExprs.length} (line ${line}).`);
    }
    // Evaluated against the *caller's* current scope, before it's swapped
    // out below for the callee's own.
    const argValues = argExprs.map((arg) => this.evalExpr(arg));

    this.callDepth++;
    if (this.callDepth > MAX_CALL_DEPTH) {
      this.callDepth--;
      throw new RuntimeError(`Stopped after ${MAX_CALL_DEPTH} nested calls — possible infinite recursion near line ${line}.`);
    }

    const savedScopes = this.scopes;
    this.scopes = [new Map()];
    fn.params.forEach((param, i) => {
      this.scopes[0].set(param.name, { kind: param.type, value: coerceToKind(argValues[i].value, param.type), initialized: true });
    });

    let returnValue: EvalValue | null = null;
    try {
      this.execBlock(fn.body);
    } catch (signal) {
      if (!(signal instanceof ReturnSignal)) {
        this.scopes = savedScopes;
        this.callDepth--;
        throw signal;
      }
      returnValue = signal.value;
    }
    this.scopes = savedScopes;
    this.callDepth--;

    const returnType = fn.returnType;
    if (returnType === 'void') return null;
    if (!returnValue) {
      throw new RuntimeError(`Method '${name}' finished without returning a value (line ${line}).`);
    }
    return { kind: returnType, value: coerceToKind(returnValue.value, returnType) };
  }

  private evalExpr(expr: Expr): EvalValue {
    switch (expr.kind) {
      case 'number':
        return { kind: expr.isInt ? 'int' : 'double', value: expr.value };
      case 'string':
        return { kind: 'String', value: expr.value };
      case 'char':
        return { kind: 'char', value: expr.value };
      case 'boolean':
        return { kind: 'boolean', value: expr.value };
      case 'identifier':
        return this.lookupInitialized(expr.name, expr.line);
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
        // An Input block's generated code is always `System.out.print(prompt);`
        // immediately followed by the read (see generator.ts's 'input' case),
        // so whatever's still pending here (not yet flushed to `output`) is
        // that same prompt — shown as the native dialog's own message,
        // instead of the dialog just saying something generic while the
        // prompt sits unseen in the output panel behind it.
        const message = this.pendingLine || DEFAULT_PROMPT_MESSAGE;
        this.flushPending();
        return readFromUser(this.promptFn, expr.method, expr.line, message);
      }
      case 'call': {
        const result = this.callFunction(expr.name, expr.args, expr.line);
        if (!result) {
          throw new RuntimeError(`'${expr.name}' doesn't return a value, so it can't be used here (line ${expr.line}).`);
        }
        return result;
      }
    }
  }
}

const DEFAULT_PROMPT_MESSAGE = 'Program is waiting for input:';

function readFromUser(promptFn: PromptFn, method: string, line: number, message: string): EvalValue {
  const raw = promptFn(message);
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

// A Declare block's value field is optional (see DeclareNode.svelte) — Java
// itself only allows this for fields, not local variables, but this
// simplified interpreter doesn't distinguish the two, so an uninitialized
// local just gets its type's normal Java default. String's real default is
// `null`; simplified to '' here rather than threading a null case through
// every value consumer (formatValue, applyBinaryOp, ...) for a case a
// beginner is unlikely to print before assigning something meaningful.
function zeroValueFor(kind: VarKind): number | string | boolean {
  switch (kind) {
    case 'int':
    case 'long':
      return 0;
    case 'double':
    case 'float':
      return 0;
    case 'boolean':
      return false;
    case 'char':
      return ' ';
    default:
      return '';
  }
}

function coerceToKind(value: number | string | boolean, kind: VarKind): number | string | boolean {
  if (kind === 'int' || kind === 'long') return Math.trunc(Number(value));
  if (kind === 'double' || kind === 'float') return Number(value);
  if (kind === 'boolean') return Boolean(value);
  if (kind === 'char') return String(value).charAt(0);
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
  getVariables(): VariableSnapshot[];
}

function snapshotVariables(interpreter: Interpreter): VariableSnapshot[] {
  return interpreter.getVariables().map(({ name, kind, value }) => ({ name, type: kind, value }));
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
      return snapshotVariables(interpreter);
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
    return { output, error: null, variables: snapshotVariables(interpreter) };
  } catch (err) {
    if (err instanceof TokenizeError || err instanceof ParseError || err instanceof RuntimeError) {
      return { output: interpreter?.getOutput() ?? [], error: err.message, variables: interpreter ? snapshotVariables(interpreter) : [] };
    }
    throw err;
  }
}
