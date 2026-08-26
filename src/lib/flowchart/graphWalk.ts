import type { Edge, Node } from '@xyflow/svelte';
import { parseDeclarations } from './declarationParser';

// Shared graph-traversal helpers for anything that needs to walk the
// flowchart along its actual edges rather than the node array's creation
// order — code generation (generator.ts) and the Arrange layout
// (stores/flowchart.ts) both need to understand Decision's branching the
// same way.

export function blockTypeOf(node: Node | undefined): string | undefined {
  return node?.data?.blockType as string | undefined;
}

// Every block has at most one outgoing edge (enforced in
// stores/flowchart.ts's pruneOutgoingEdge) except the two "branching" block
// types below, which have exactly two — one per named handle
// (pruneOutgoingEdgeForHandle). "no handle" (null/undefined sourceHandle)
// covers every non-branching source.
//
// Decision's pair is a real if/else fork: both branches run once, and
// generator.ts/arrangeNodesVertically look for where they reconverge (see
// findMergePoint). ForLoop's and WhileLoop's pairs look structurally
// identical — same "two named handles, one edge each" rule — but mean
// something different: 'loop' leads into the body, which the user wires back
// to the loop node itself to close the loop, and 'exit' is simply "what
// comes after," not a second branch to reconverge with. generator.ts and
// stores/flowchart.ts's Arrange each handle that distinction themselves;
// this map only centralizes the handle *names*, shared by every caller that
// needs to prune/find-free/probe reachability without caring which of the
// block types it's looking at.
const BRANCH_HANDLES: Record<string, readonly [string, string]> = {
  decision: ['true', 'false'],
  forLoop: ['loop', 'exit'],
  whileLoop: ['loop', 'exit'],
};

export function branchHandlesOf(blockType: string | undefined): readonly [string, string] | null {
  return blockType ? (BRANCH_HANDLES[blockType] ?? null) : null;
}

export function outgoing(edges: Edge[], sourceId: string, sourceHandle: string | null): string | null {
  const edge = edges.find((e) => e.source === sourceId && (e.sourceHandle ?? null) === sourceHandle);
  return edge?.target ?? null;
}

// Which of a branching block's two handles is still free to take a new
// outgoing edge — the first handle in its pair is preferred, since it's the
// one that continues straight down (matching arrangeNodesVertically: 'true'
// and 'loop' are both "the branch that goes first"). Returns null once both
// are wired, i.e. this node has nothing left to auto-connect, or the node
// isn't a branching block at all.
export function unusedBranchHandle(node: Node, edgeList: Edge[]): string | null {
  const handles = branchHandlesOf(blockTypeOf(node));
  if (!handles) return null;
  const used = new Set(edgeList.filter((edge) => edge.source === node.id).map((edge) => edge.sourceHandle));
  return handles.find((handle) => !used.has(handle)) ?? null;
}

// All node ids reachable by following outgoing edges from startId — for a
// branching node this means both of its handles, recursively (for ForLoop,
// its own id is trivially "reachable" from itself via the loop-back edge,
// which is fine: this is only ever consulted through the visited-guarded
// walks below, never walked on its own). Used only to find where two
// branches of an *outer* if/else reconverge, so callers know where to stop
// each branch and continue once, rather than processing (generating code
// for, or laying out) the shared tail twice — including when a ForLoop sits
// inside one of those branches, which is why this isn't Decision-only.
export function reachableFrom(startId: string | null, nodesById: Map<string, Node>, edges: Edge[]): Set<string> {
  const visited = new Set<string>();
  const stack = startId ? [startId] : [];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodesById.get(id);
    const handles = branchHandlesOf(blockTypeOf(node));
    if (handles) {
      for (const handle of handles) {
        const nextId = outgoing(edges, id, handle);
        if (nextId) stack.push(nextId);
      }
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
    const handles = branchHandlesOf(blockTypeOf(node));
    if (handles) {
      for (const handle of handles) {
        const nextId = outgoing(edges, id, handle);
        if (nextId) queue.push(nextId);
      }
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
// block — ones declared in a Declare block, or in a ForLoop's own `init`
// clause (e.g. "int i = 0" — parsed the same way a Declare block's typed-in
// code would be, via declarationParser.ts), somewhere upstream of it
// (connected via edges, walking backward through every incoming edge — a
// merge point after a Decision can have more than one, and a ForLoop's body
// reaches back to it too), not just anywhere on the canvas. A block sitting
// unconnected, or declared only on a branch that doesn't lead here, doesn't
// count: a variable used here should always be one Java would actually see
// by the time this block runs.
//
// Doesn't model block scoping precisely — a variable from one Decision
// branch (or a ForLoop's `init`) is treated as visible past where its
// branch/loop ends too, same as the rest of this app's simplified variable
// tracking, even though the *generated* code's real scoping (see
// interpreter.ts's pushScope/popScope) would actually reject using it
// there. Picking such a suggestion from a dropdown can produce code that
// fails at Run — a known gap, not one this function tries to close.
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

  function addEntry(entry: UpstreamDeclaration) {
    if (entry.varName && !seenNames.has(entry.varName)) {
      seenNames.add(entry.varName);
      entries.push(entry);
    }
  }

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    for (const edge of edgeList) {
      if (edge.target !== currentId || visited.has(edge.source)) continue;
      visited.add(edge.source);
      stack.push(edge.source);

      const sourceNode = nodesById.get(edge.source);
      const sourceType = blockTypeOf(sourceNode);

      if (sourceType === 'declare') {
        const declEntries = (sourceNode?.data?.entries as UpstreamDeclaration[] | undefined) ?? [];
        for (const entry of declEntries) addEntry(entry);
      } else if (sourceType === 'forLoop') {
        const init = ((sourceNode?.data?.init as string | undefined) ?? '').trim();
        if (!init) continue;
        const [decl] = parseDeclarations(`${init};`);
        if (decl) addEntry(decl);
      }
    }
  }

  return entries;
}

// Just the names — what Output/Assign/Input's variable dropdowns actually need.
export function declaredVariableNamesUpstreamOf(nodeId: string, nodeList: Node[], edgeList: Edge[]): string[] {
  return declaredVariableEntriesUpstreamOf(nodeId, nodeList, edgeList).map((entry) => entry.varName);
}

// The Subroutine Start (if any) whose body reaches nodeId — found by
// walking backward through incoming edges, same traversal shape as
// declaredVariableEntriesUpstreamOf above, just stopping the moment one is
// found rather than collecting every declaration along the way. Used by
// SubroutineEndNode.svelte to know whether (and what return type) to show
// its own return-value field for — a subroutine's own End has no direct
// link back to its Start otherwise (see SubroutineEndNodeData).
export function subroutineStartUpstreamOf(nodeId: string, nodeList: Node[], edgeList: Edge[]): Node | null {
  const nodesById = new Map(nodeList.map((node) => [node.id, node]));
  const visited = new Set<string>([nodeId]);
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    for (const edge of edgeList) {
      if (edge.target !== currentId || visited.has(edge.source)) continue;
      visited.add(edge.source);
      const sourceNode = nodesById.get(edge.source);
      if (blockTypeOf(sourceNode) === 'subroutineStart') return sourceNode ?? null;
      stack.push(edge.source);
    }
  }
  return null;
}
