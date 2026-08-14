import type { Edge, Node } from '@xyflow/svelte';

// Shared graph-traversal helpers for anything that needs to walk the
// flowchart along its actual edges rather than the node array's creation
// order — code generation (generator.ts) and the Arrange layout
// (stores/flowchart.ts) both need to understand Decision's branching the
// same way.

export function blockTypeOf(node: Node | undefined): string | undefined {
  return node?.data?.blockType as string | undefined;
}

// Everything except Decision has at most one outgoing edge (enforced in
// stores/flowchart.ts's pruneOutgoingEdge); Decision has up to two, one per
// handle (pruneOutgoingEdgeForHandle). "no handle" (null/undefined
// sourceHandle) covers every non-Decision source.
export function outgoing(edges: Edge[], sourceId: string, sourceHandle: string | null): string | null {
  const edge = edges.find((e) => e.source === sourceId && (e.sourceHandle ?? null) === sourceHandle);
  return edge?.target ?? null;
}

// All node ids reachable by following outgoing edges from startId — for a
// Decision node this means both its "true" and "false" branches,
// recursively. Used only to find where two branches of an *outer* if/else
// reconverge, so callers know where to stop each branch and continue once,
// rather than processing (generating code for, or laying out) the shared
// tail twice.
export function reachableFrom(startId: string | null, nodesById: Map<string, Node>, edges: Edge[]): Set<string> {
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
export function findMergePoint(
  trueId: string | null,
  falseId: string | null,
  nodesById: Map<string, Node>,
  edges: Edge[],
): string | null {
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

export interface UpstreamDeclaration {
  varType: string;
  varName: string;
  varValue: string;
}

// Declared-variable entries (name, type, value) available to a specific
// block — only ones declared in a Declare block somewhere upstream of it
// (connected via edges, walking backward through every incoming edge — a
// merge point after a Decision can have more than one), not just anywhere
// on the canvas. A block sitting unconnected, or declared only on a branch
// that doesn't lead here, doesn't count: a variable used here should always
// be one Java would actually see by the time this block runs.
//
// Lives here (not stores/flowchart.ts) so generator.ts can use the same
// logic for its own type lookups (e.g. picking Scanner.nextInt() vs
// .nextDouble() for an Input block) without depending on the stateful
// store module just for this one pure traversal.
export function declaredVariableEntriesUpstreamOf(nodeId: string, nodeList: Node[], edgeList: Edge[]): UpstreamDeclaration[] {
  const nodesById = new Map(nodeList.map((node) => [node.id, node]));
  const entries: UpstreamDeclaration[] = [];
  const seenNames = new Set<string>();
  const visited = new Set<string>([nodeId]);
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    for (const edge of edgeList) {
      if (edge.target !== currentId || visited.has(edge.source)) continue;
      visited.add(edge.source);
      stack.push(edge.source);

      const sourceNode = nodesById.get(edge.source);
      if (blockTypeOf(sourceNode) !== 'declare') continue;
      const declEntries = (sourceNode?.data?.entries as UpstreamDeclaration[] | undefined) ?? [];
      for (const entry of declEntries) {
        if (entry.varName && !seenNames.has(entry.varName)) {
          seenNames.add(entry.varName);
          entries.push(entry);
        }
      }
    }
  }

  return entries;
}

// Just the names — what Output/Assign/Input's variable dropdowns actually need.
export function declaredVariableNamesUpstreamOf(nodeId: string, nodeList: Node[], edgeList: Edge[]): string[] {
  return declaredVariableEntriesUpstreamOf(nodeId, nodeList, edgeList).map((entry) => entry.varName);
}
