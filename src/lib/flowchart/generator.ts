import type { Edge, Node } from '@xyflow/svelte';
import { blockTypeOf, outgoing, findMergePoint, declaredVariableEntriesUpstreamOf } from './graphWalk';

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
  const label = (node.data?.label as string | undefined) ?? '';

  switch (blockType) {
    case 'start':
    case 'end':
    case 'decision': // handled separately in walk() — branches, not a single statement
    case 'forLoop': // handled separately in walk() — branches (and loops back), not a single statement
      return [];
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
      // FlowchartBoard's handleDrop), each becoming its own line.
      const entries = (node.data?.entries as { varType: string; varName: string; varValue: string }[] | undefined) ?? [];
      return entries
        .map((entry, rowIndex) => ({ entry, rowIndex }))
        .filter(({ entry }) => entry.varName.trim())
        .map(({ entry, rowIndex }) => ({ text: `${entry.varType} ${entry.varName} = ${entry.varValue};`, rowIndex }));
    }
    case 'assign': {
      // One block can hold several assignments (the "+ Add assignment"
      // control), each becoming its own line.
      const entries = (node.data?.entries as { varName: string; operator: string; value: string }[] | undefined) ?? [];
      return entries
        .map((entry, rowIndex) => ({ entry, rowIndex }))
        .filter(({ entry }) => entry.varName.trim())
        .map(({ entry, rowIndex }) => ({ text: `${entry.varName} ${entry.operator} ${entry.value};`, rowIndex }));
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
        const varType = declarations.find((d) => d.varName === entry.varName)?.varType ?? 'int';
        // Trimmed only to test for "is there a prompt at all" — the actual
        // text keeps any trailing space the user typed on purpose (e.g.
        // "Enter x: " reads better before the input than "Enter x:").
        if (entry.prompt.trim()) lines.push({ text: `System.out.print("${escapeJavaString(entry.prompt)}");`, rowIndex });
        lines.push({ text: `${entry.varName} = scanner.${scannerMethodFor(varType)}();`, rowIndex });
      });
      return lines;
    }
    case 'whileLoop':
      return [{ text: `// TODO: ${label} — not generated yet`, rowIndex: -1 }];
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
// given, following the single outgoing edge each block has — except the two
// branching block types (see graphWalk.ts's branchHandlesOf). Decision
// recurses into both branches and resumes the outer walk at their merge
// point (see findMergePoint), producing a real `if (...) { ... } else { ... }`
// instead of visiting one arbitrary branch. ForLoop recurses into just its
// 'loop' branch (the body) once, stopping the moment that walk loops back
// around the user-drawn back-edge to the ForLoop node itself — the same
// "stop at this id" mechanism as Decision's merge point, just with the
// ForLoop's own id standing in for one. The real repetition happens at
// runtime, from the emitted `for (...) { ... }` — the body's Java text is
// only ever walked, and emitted, once.
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
