import { get } from 'svelte/store';
import { addEdge, MarkerType, type Connection, type Edge, type Node } from '@xyflow/svelte';
import {
  nodes,
  edges,
  createDeclareNode,
  addDeclarationEntry,
  entriesLabel,
  createProcessNode,
  statementsLabel,
  bottomMostNodeId,
  pruneOutgoingEdge,
  nodeWidthFor,
  DEFAULT_CANVAS_X,
  BLOCK_WIDTH,
  type DeclareNodeData,
  type ProcessNodeData,
  type DeclarationEntry,
} from './flowchart';
import { codeContent } from './code';
import { generateJavaCode } from '../lib/flowchart/generator';
import { parseDeclarations } from '../lib/flowchart/declarationParser';
import { parseStatements } from '../lib/flowchart/statementParser';

// Guards against the two directions fighting each other: while one side is
// applying an update it came from, the other side's reactive sync is
// skipped for that round, so typing in the editor never gets its text
// silently replaced mid-keystroke by a flowchart-driven regeneration.
let isApplyingCodeSync = false;

// Code generation now walks edges too (Decision's branches — see
// generator.ts), so it has to regenerate on an edge-only change as well,
// not just when nodes change — e.g. manually rewiring a branch to a
// different target without touching any node.
function syncFlowchartToCode() {
  if (isApplyingCodeSync) return;
  codeContent.set(generateJavaCode(get(nodes), get(edges)));
}

nodes.subscribe(syncFlowchartToCode);
edges.subscribe(syncFlowchartToCode);

function blockTypeOf(node: Node): string | undefined {
  return (node.data as { blockType?: string } | undefined)?.blockType;
}

export function syncCodeToFlowchart(code: string) {
  const declarations = parseDeclarations(code);
  const declByName = new Map(declarations.map((d) => [d.varName, d]));
  const statements = parseStatements(code);
  const current = get(nodes);

  // Declare blocks can hold several variables (merged via drag — see
  // FlowchartBoard's handleDrop) — each entry is matched by variable name,
  // a stable identity that survives reordering elsewhere in the file.
  // Entries whose variable no longer appears in the code are dropped; a
  // block left with no entries is dropped entirely.
  function reconcileDeclareNode(node: Node): Node | null {
    const data = node.data as Partial<DeclareNodeData>;
    const nextEntries: DeclarationEntry[] = [];
    let changed = false;

    for (const entry of data.entries ?? []) {
      const decl = declByName.get(entry.varName);
      if (!decl) {
        changed = true;
        continue;
      }
      if (decl.varType !== entry.varType || decl.varValue !== entry.varValue) changed = true;
      nextEntries.push({ varType: decl.varType, varName: entry.varName, varValue: decl.varValue });
    }

    if (nextEntries.length === 0) return null;
    if (!changed) return node;
    return { ...node, data: { ...node.data, entries: nextEntries, label: entriesLabel(nextEntries) } };
  }

  // Process/Output blocks can likewise hold several print statements (the
  // "+ Add variable" control), but statements have no natural key — they're
  // matched positionally: the Nth non-blank statement slot across all
  // Process blocks <-> the Nth recognized statement line in the code. Blank
  // slots (an "+ Add variable" row with nothing picked yet) don't produce
  // any code line at all, so they're carried over untouched rather than
  // consumed from that positional match. Slots beyond what the code still
  // has are dropped; a block left with no statements is dropped entirely.
  let statementSlot = 0;
  function reconcileProcessNode(node: Node): Node | null {
    const data = node.data as Partial<ProcessNodeData>;
    const nextStatements: string[] = [];
    let changed = false;

    for (const oldStatement of data.statements ?? []) {
      if (!oldStatement.trim()) {
        nextStatements.push(oldStatement);
        continue;
      }
      const text = statements[statementSlot];
      statementSlot += 1;
      if (text === undefined) {
        changed = true;
        continue;
      }
      if (text !== oldStatement) changed = true;
      nextStatements.push(text);
    }

    if (nextStatements.length === 0) return null;
    if (!changed) return node;
    return { ...node, data: { ...node.data, statements: nextStatements, label: statementsLabel(nextStatements) } };
  }

  const result: Node[] = [];
  for (const node of current) {
    const type = blockTypeOf(node);
    if (type === 'declare') {
      const reconciled = reconcileDeclareNode(node);
      if (reconciled) result.push(reconciled);
      continue;
    }
    if (type === 'process') {
      const reconciled = reconcileProcessNode(node);
      if (reconciled) result.push(reconciled);
      continue;
    }
    result.push(node);
  }

  // New declarations/statements the code has that no existing entry
  // accounts for yet. Each merges into the current bottom of the flow when
  // that's already the same kind of block (mirroring the drag-and-drop
  // auto-connect/merge in FlowchartBoard.svelte); otherwise it becomes its
  // own new, auto-connected node.
  const existingNames = new Set(
    result
      .filter((node) => blockTypeOf(node) === 'declare')
      .flatMap((node) => (node.data as Partial<DeclareNodeData>).entries ?? [])
      .map((entry) => entry.varName),
  );

  // New declare/process nodes are always BLOCK_WIDTH wide, but the anchor
  // (often Start) may not be — align by center, not shared x, so a
  // Declare block chained under the narrower Start still looks centered
  // under it rather than shifted right.
  const anchorId = bottomMostNodeId(result);
  const anchorNode = result.find((node) => node.id === anchorId) ?? null;
  const anchorCenterX = anchorNode ? anchorNode.position.x + nodeWidthFor(anchorNode) / 2 : DEFAULT_CANVAS_X + BLOCK_WIDTH / 2;
  const anchorX = anchorCenterX - BLOCK_WIDTH / 2;
  let nextY = anchorNode ? anchorNode.position.y + 90 : 50;

  let previousId = anchorId;
  let workingEdges: Edge[] = get(edges);

  function connectChain(targetId: string) {
    if (previousId) {
      const connection: Connection = { source: previousId, target: targetId, sourceHandle: null, targetHandle: null };
      workingEdges = addEdge(
        { ...connection, markerEnd: { type: MarkerType.ArrowClosed } },
        pruneOutgoingEdge(workingEdges, previousId),
      );
    }
    previousId = targetId;
  }

  for (const decl of declarations) {
    if (existingNames.has(decl.varName)) continue;
    existingNames.add(decl.varName);

    const anchor = previousId ? result.find((node) => node.id === previousId) : undefined;
    if (anchor && blockTypeOf(anchor) === 'declare') {
      const index = result.indexOf(anchor);
      result[index] = addDeclarationEntry(anchor, decl);
      continue;
    }

    const node = createDeclareNode({ x: anchorX, y: nextY }, decl);
    nextY += 90;
    result.push(node);
    connectChain(node.id);
  }

  for (const text of statements.slice(statementSlot)) {
    const node = createProcessNode({ x: anchorX, y: nextY }, text);
    nextY += 90;
    result.push(node);
    connectChain(node.id);
  }

  const changed = result.length !== current.length || result.some((node, i) => node !== current[i]);
  if (!changed) return;

  // Also prunes edges left dangling by the stale-entry/node filtering
  // above, so removed blocks don't leave orphaned edges behind.
  const resultIds = new Set(result.map((node) => node.id));

  isApplyingCodeSync = true;
  nodes.set(result);
  edges.set(workingEdges.filter((edge) => resultIds.has(edge.source) && resultIds.has(edge.target)));
  isApplyingCodeSync = false;
}
