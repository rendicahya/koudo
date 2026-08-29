import type { Edge, Node } from '@xyflow/svelte';
import { blockTypeOf, outgoing, findMergePoint, declaredVariableEntriesUpstreamOf } from './graphWalk';
import { formatDeclaredValue } from './valueFormat';
import { arrayBaseType, parseIndexedRef } from './arrayType';

// Free-typed text (an Input block's prompt) embedded into a generated Java
// string literal needs its own quotes/backslashes escaped, or a `"` typed
// into the prompt field would break the generated code's syntax.
function escapeJavaString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Scanner method for a variable's declared type — read a whole word
// (`.next()`) for anything not otherwise recognized (including String,
// since `.nextLine()` would swallow the rest of the current input line
// instead of just one token, a common beginner gotcha this sidesteps).
function scannerMethodFor(varType: string): string {
  switch (varType) {
    case 'int':
    case 'long':
      return 'nextInt';
    case 'double':
    case 'float':
      return 'nextDouble';
    case 'boolean':
      return 'nextBoolean';
    default:
      return 'next';
  }
}

// One block's generated Java text, one entry per line, each still carrying
// the index of the entries/statements row (as rendered by
// DeclareNode/AssignNode/ProcessNode/InputNode) it came from. An Input
// entry can produce two lines (an optional prompt-print, then the read)
// that both belong to the same row — everything else is one row, one line.
// rowIndex is -1 for a line with no corresponding UI row (only the
// forLoop/whileLoop placeholder, which isn't a real entries list).
//
// Exported for the step-by-step runner (stores/stepRunner.ts) — it's how
// Step Through points its per-line arrow (see stepCurrentRow) at the right
// row inside a multi-line block, not just the block as a whole.
export interface StatementLine {
  text: string;
  rowIndex: number;
}

export function statementLinesFor(node: Node, nodesById: Map<string, Node>, edges: Edge[]): StatementLine[] {
  const blockType = blockTypeOf(node);

  switch (blockType) {
    case 'start':
    case 'end':
    case 'subroutineStart': // its own body is walked separately as a method, never inline (see subroutineMethods)
    case 'decision': // handled separately in walk() — branches, not a single statement
    case 'forLoop': // handled separately in walk() — branches (and loops back), not a single statement
    case 'whileLoop': // handled separately in walk() — branches (and loops back), not a single statement
      return [];
    case 'subroutineEnd': {
      // Blank for a void subroutine's End (see SubroutineEndNodeData) — no
      // `return` at all, matching a void method's own bare `}` close.
      const returnValue = ((node.data?.returnValue as string | undefined) ?? '').trim();
      return returnValue ? [{ text: `return ${returnValue};`, rowIndex: 0 }] : [];
    }
    case 'subroutineCall': {
      // References its target by node id, not name (see
      // SubroutineCallNodeData) — the target's current name is looked up
      // fresh here rather than trusted from stale label text.
      const data = node.data as { targetId?: string; args?: string[]; resultVar?: string } | undefined;
      const targetNode = data?.targetId ? nodesById.get(data.targetId) : undefined;
      const name = (targetNode?.data as { name?: string } | undefined)?.name;
      if (!name) return [];
      const args = data?.args ?? [];
      const call = `${name}(${args.join(', ')})`;
      const text = data?.resultVar ? `${data.resultVar} = ${call};` : `${call};`;
      return [{ text, rowIndex: 0 }];
    }
    case 'process': {
      // One block can hold several print statements (see
      // ProcessNode.svelte's "+ Add variable"), each becoming its own line.
      const statements = (node.data?.statements as string[] | undefined) ?? [];
      return statements
        .map((statement, rowIndex) => ({ text: statement.trim(), rowIndex }))
        .filter((line) => line.text)
        .map((line) => ({ text: `${line.text};`, rowIndex: line.rowIndex }));
    }
    case 'declare': {
      // One block can hold several variables (merged via drag — see
      // FlowchartBoard's handleDrop), each becoming its own line. A blank
      // value field (see DeclareNode.svelte) means "declare only" — no `=
      // ...` at all, not an (invalid) empty initializer.
      const entries =
        (node.data?.entries as { varType: string; varName: string; varValue: string; isConst?: boolean }[] | undefined) ?? [];
      return entries
        .map((entry, rowIndex) => ({ entry, rowIndex }))
        .filter(({ entry }) => entry.varName.trim())
        .map(({ entry, rowIndex }) => {
          // Not .trim() — a value that's just a space is a real (String)
          // value the user typed on purpose, not "no value given".
          const hasValue = entry.varValue.length > 0;
          const prefix = entry.isConst ? 'final ' : '';
          const text = hasValue
            ? `${prefix}${entry.varType} ${entry.varName} = ${formatDeclaredValue(entry.varType, entry.varValue)};`
            : `${prefix}${entry.varType} ${entry.varName};`;
          return { text, rowIndex };
        });
    }
    case 'assign': {
      // One block can hold several assignments (the "+ Add assignment"
      // control), each becoming its own line. A value that names another
      // declared variable is a reference (assigned as-is); anything else is
      // a literal, quoted per the *target's* own type (see AssignNode.svelte's
      // matching type-aware value editor) — same String/char auto-quoting as
      // Declare's entries. Unlike Declare, an assignment's value isn't
      // optional (`x = ;` isn't valid Java the way `int x;` is) — a row
      // whose value is still blank (its own starting state — see
      // AssignNode.svelte's valueKind) is filtered out entirely rather than
      // emitted broken.
      const entries = (node.data?.entries as { varName: string; operator: string; value: string }[] | undefined) ?? [];
      const nodeList = [...nodesById.values()];
      const declarations = declaredVariableEntriesUpstreamOf(node.id, nodeList, edges);
      const declaredNames = new Set(declarations.map((d) => d.varName));
      return entries
        .map((entry, rowIndex) => ({ entry, rowIndex }))
        .filter(({ entry }) => entry.varName.trim() && entry.value.trim())
        .map(({ entry, rowIndex }) => {
          // An indexed reference (`arr[0]`, `arr[i]`) reads a single element
          // at runtime, same as a plain variable reference — never a literal
          // to be quoted per the *target's* own type, even though its text
          // never exact-matches a declared name the way a plain reference
          // does.
          const isVarRef = declaredNames.has(entry.value) || parseIndexedRef(entry.value) !== null;
          const targetType = declarations.find((d) => d.varName === entry.varName)?.varType;
          const value = isVarRef || !targetType ? entry.value : formatDeclaredValue(targetType, entry.value);
          return { text: `${entry.varName} ${entry.operator} ${value};`, rowIndex };
        });
    }
    case 'input': {
      // One block can hold several reads (the "+ Add input" control), each
      // becoming a prompt-print (if a prompt was given) plus a read line —
      // the Scanner method is picked from the target variable's own
      // declared type, wherever upstream that was declared.
      const entries = (node.data?.entries as { varName: string; prompt: string }[] | undefined) ?? [];
      const nodeList = [...nodesById.values()];
      const declarations = declaredVariableEntriesUpstreamOf(node.id, nodeList, edges);
      const lines: StatementLine[] = [];
      entries.forEach((entry, rowIndex) => {
        if (!entry.varName.trim()) return;
        // An indexed target (`arr[0]`) reads its element type from the
        // *array's* own declared type — its own varName never exact-matches
        // a declared name the way a plain target does.
        const indexed = parseIndexedRef(entry.varName);
        const declaredType = indexed
          ? declarations.find((d) => d.varName === indexed.name)?.varType
          : declarations.find((d) => d.varName === entry.varName)?.varType;
        const varType = (indexed && declaredType ? arrayBaseType(declaredType) : declaredType) ?? 'int';
        // Trimmed only to test for "is there a prompt at all" — the actual
        // text keeps any trailing space the user typed on purpose (e.g.
        // "Enter x: " reads better before the input than "Enter x:").
        if (entry.prompt.trim()) lines.push({ text: `System.out.print("${escapeJavaString(entry.prompt)}");`, rowIndex });
        lines.push({ text: `${entry.varName} = scanner.${scannerMethodFor(varType)}();`, rowIndex });
      });
      return lines;
    }
    default:
      return [];
  }
}

// Codegen's own view of the above — just the text, joined into the one
// multi-line statement walk() splices into the generated program.
function statementFor(node: Node, nodesById: Map<string, Node>, edges: Edge[]): string | null {
  const lines = statementLinesFor(node, nodesById, edges);
  return lines.length > 0 ? lines.map((line) => line.text).join('\n') : null;
}

function indent(lines: string[]): string[] {
  return lines.map((line) => `    ${line}`);
}

// Walks the flow starting at nodeId, stopping at stopId (exclusive) if
// given, following the single outgoing edge each block has — except the
// branching block types (see graphWalk.ts's branchHandlesOf). Decision
// recurses into both branches and resumes the outer walk at their merge
// point (see findMergePoint), producing a real `if (...) { ... } else { ... }`
// instead of visiting one arbitrary branch. ForLoop/WhileLoop each recurse
// into just their 'loop' branch (the body) once, stopping the moment that
// walk loops back around the user-drawn back-edge to the loop node itself —
// the same "stop at this id" mechanism as Decision's merge point, just with
// the loop node's own id standing in for one. The real repetition happens at
// runtime, from the emitted `for (...) { ... }` / `while (...) { ... }` —
// the body's Java text is only ever walked, and emitted, once.
function walk(nodeId: string | null, stopId: string | null, nodesById: Map<string, Node>, edges: Edge[], guard: Set<string>): string[] {
  const lines: string[] = [];
  let currentId = nodeId;

  while (currentId && currentId !== stopId) {
    if (guard.has(currentId)) break; // cycle guard — shouldn't happen given the single-outgoing-edge rule, but don't hang if it does
    guard.add(currentId);

    const node = nodesById.get(currentId);
    if (!node) break;

    if (blockTypeOf(node) === 'decision') {
      const trueId = outgoing(edges, currentId, 'true');
      const falseId = outgoing(edges, currentId, 'false');
      const mergeId = findMergePoint(trueId, falseId, nodesById, edges);
      const condition = ((node.data?.condition as string | undefined) ?? '').trim() || 'true';

      lines.push(`if (${condition}) {`);
      lines.push(...indent(walk(trueId, mergeId, nodesById, edges, guard)));
      if (falseId) {
        lines.push('} else {');
        lines.push(...indent(walk(falseId, mergeId, nodesById, edges, guard)));
      }
      lines.push('}');

      currentId = mergeId;
      continue;
    }

    if (blockTypeOf(node) === 'forLoop') {
      const bodyId = outgoing(edges, currentId, 'loop');
      const exitId = outgoing(edges, currentId, 'exit');
      const data = node.data as { init?: string; condition?: string; update?: string } | undefined;
      const init = (data?.init ?? '').trim();
      const condition = (data?.condition ?? '').trim() || 'true';
      const update = (data?.update ?? '').trim();

      lines.push(`for (${init}; ${condition}; ${update}) {`);
      lines.push(...indent(walk(bodyId, currentId, nodesById, edges, guard)));
      lines.push('}');

      currentId = exitId;
      continue;
    }

    if (blockTypeOf(node) === 'whileLoop') {
      const bodyId = outgoing(edges, currentId, 'loop');
      const exitId = outgoing(edges, currentId, 'exit');
      const condition = ((node.data?.condition as string | undefined) ?? '').trim() || 'true';

      lines.push(`while (${condition}) {`);
      lines.push(...indent(walk(bodyId, currentId, nodesById, edges, guard)));
      lines.push('}');

      currentId = exitId;
      continue;
    }

    const statement = statementFor(node, nodesById, edges);
    if (statement) lines.push(...statement.split('\n'));
    currentId = outgoing(edges, currentId, null);
  }

  return lines;
}

const SCANNER_CALL_PATTERN = /\.\s*(nextInt|nextDouble|nextBoolean|nextLine|next)\s*\(\s*\)/;

export function generateJavaCode(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return '';
  }

  const startNode = nodes.find((node) => blockTypeOf(node) === 'start');
  if (!startNode) {
    return '// Add a Start block to generate code.\n';
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const lines = walk(startNode.id, null, nodesById, edges, new Set());

  if (lines.length === 0) return '';

  // Only reachable Input blocks actually produce a `.nextX()` call, so
  // check the generated output itself rather than raw node data — an Input
  // block that's on the canvas but disconnected from the flow shouldn't
  // get a Scanner declared for it.
  if (lines.some((line) => SCANNER_CALL_PATTERN.test(line))) {
    lines.unshift('Scanner scanner = new Scanner(System.in);');
  }

  return `${lines.join('\n')}\n`;
}

// The extra `private static void <name>(<params>) { ... }` methods a
// flowchart's Subroutine Start blocks (see SubroutineStartNodeData) each
// generate — one per Subroutine Start, walked from its own body the same way
// generateJavaCode walks main's. Deliberately separate from codeContent
// (generateJavaCode's return value), which is also parsed for two-way
// sync (see stores/sync.ts's syncCodeToFlowchart) — that parsing only
// understands declarations/statements, not method declarations, so mixing
// the two would break round-tripping edits made directly in the code panel.
// Two consumers splice this back in themselves instead: wrapAsJavaFile
// (Export Java / the Java tab's compilable output — see
// CodeEditorPanel.svelte) and ▶ Run (see OutputPanel.svelte's handleRun,
// which feeds both into lib/execution/*'s interpreter — it does understand
// method declarations and calls, just not from codeContent alone). Step
// Through (stores/stepRunner.ts) still doesn't execute a Subroutine Call —
// it walks one flowchart node at a time and has no notion of jumping into a
// separate subroutine's own node chain — surfacing the interpreter's own
// parse error if one appears mid-step, same honest failure as any other
// unsupported construct typed into the code panel.
export function generateJavaMethods(nodes: Node[], edges: Edge[]): string {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const starts = nodes.filter((node) => blockTypeOf(node) === 'subroutineStart');

  const methods = starts.map((startNode) => {
    const data = startNode.data as
      | { name?: string; params?: { paramType: string; paramName: string }[]; returnType?: string }
      | undefined;
    const name = data?.name || 'method';
    const params = data?.params ?? [];
    const returnType = data?.returnType || 'void';
    const bodyLines = walk(startNode.id, null, nodesById, edges, new Set());
    if (bodyLines.some((line) => SCANNER_CALL_PATTERN.test(line))) {
      bodyLines.unshift('Scanner scanner = new Scanner(System.in);');
    }
    const paramList = params.map((p) => `${p.paramType} ${p.paramName}`).join(', ');
    const body = indent(bodyLines).join('\n');
    return `private static ${returnType} ${name}(${paramList}) {\n${body}\n}`;
  });

  return methods.join('\n\n');
}
