import type { Edge, Node } from '@xyflow/svelte';

function blockTypeOf(node: Node): string | undefined {
  return node.data?.blockType as string | undefined;
}

// Everything except Decision has at most one outgoing edge (enforced in
// stores/flowchart.ts's pruneOutgoingEdge); Decision has up to two, one per
// handle (pruneOutgoingEdgeForHandle). "no handle" (null/undefined
// sourceHandle) covers every non-Decision source.
function outgoing(edges: Edge[], sourceId: string, sourceHandle: string | null): string | null {
  const edge = edges.find((e) => e.source === sourceId && (e.sourceHandle ?? null) === sourceHandle);
  return edge?.target ?? null;
}

function statementFor(node: Node): string | null {
  const blockType = blockTypeOf(node);
  const label = (node.data?.label as string | undefined) ?? '';

  switch (blockType) {
    case 'start':
    case 'end':
    case 'decision': // handled separately in walk() — branches, not a single statement
      return null;
    case 'process': {
      // One block can hold several print statements (see
      // ProcessNode.svelte's "+ Add variable"), each becoming its own line.
      const statements = (node.data?.statements as string[] | undefined) ?? [];
      const lines = statements.map((s) => s.trim()).filter(Boolean).map((s) => `${s};`);
      return lines.length > 0 ? lines.join('\n') : null;
    }
    case 'declare': {
      // One block can hold several variables (merged via drag — see
      // FlowchartBoard's handleDrop), each becoming its own line.
      const entries = (node.data?.entries as { varType: string; varName: string; varValue: string }[] | undefined) ?? [];
      const lines = entries.filter((e) => e.varName.trim()).map((e) => `${e.varType} ${e.varName} = ${e.varValue};`);
      return lines.length > 0 ? lines.join('\n') : null;
    }
    case 'forLoop':
    case 'whileLoop':
      return `// TODO: ${label} — not generated yet`;
    default:
      return null;
  }
}

// All node ids reachable by following outgoing edges from startId — for a
// Decision node this means both its "true" and "false" branches, recursively.
// Used only to find where two branches of an *outer* if/else reconverge, so
// walk() knows where to stop each branch and continue once, rather than
// generating the shared tail twice.
function reachableFrom(startId: string | null, nodesById: Map<string, Node>, edges: Edge[]): Set<string> {
  const visited = new Set<string>();
  const stack = startId ? [startId] : [];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodesById.get(id);
    if (blockTypeOf(node) === 'decision') {
      const trueId = outgoing(edges, id, 'true');
      const falseId = outgoing(edges, id, 'false');
      if (trueId) stack.push(trueId);
      if (falseId) stack.push(falseId);
    } else {
      const nextId = outgoing(edges, id, null);
      if (nextId) stack.push(nextId);
    }
  }
  return visited;
}

// The first node (breadth-first from falseId) that's also reachable from
// trueId — a reasonable "where do these two branches reconverge" heuristic
// for the straight-line-with-branches graphs this app's canvas produces.
// Returns null if they never reconverge (each branch runs to its own End,
// for instance).
function findMergePoint(trueId: string | null, falseId: string | null, nodesById: Map<string, Node>, edges: Edge[]): string | null {
  if (!trueId || !falseId) return null;
  const trueReachable = reachableFrom(trueId, nodesById, edges);

  const queue: string[] = [falseId];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (trueReachable.has(id)) return id;

    const node = nodesById.get(id);
    if (blockTypeOf(node) === 'decision') {
      const t = outgoing(edges, id, 'true');
      const f = outgoing(edges, id, 'false');
      if (t) queue.push(t);
      if (f) queue.push(f);
    } else {
      const nextId = outgoing(edges, id, null);
      if (nextId) queue.push(nextId);
    }
  }
  return null;
}

function indent(lines: string[]): string[] {
  return lines.map((line) => `    ${line}`);
}

// Walks the flow starting at nodeId, stopping at stopId (exclusive) if
// given, following the single outgoing edge each block has — except
// Decision, which recurses into both branches and resumes the outer walk
// at their merge point (see findMergePoint), producing a real
// `if (...) { ... } else { ... }` instead of visiting one arbitrary branch.
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

    const statement = statementFor(node);
    if (statement) lines.push(...statement.split('\n'));
    currentId = outgoing(edges, currentId, null);
  }

  return lines;
}

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

  return `${lines.join('\n')}\n`;
}
