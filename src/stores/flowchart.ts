import type { Edge, Node } from '@xyflow/svelte';
import { derived, writable } from 'svelte/store';

export type BlockType = 'start' | 'end' | 'process' | 'declare' | 'forLoop' | 'decision' | 'whileLoop';

export interface DeclarationEntry {
  varType: string;
  varName: string;
  varValue: string;
}

// A Declare block can hold several variables at once — dropping a new
// Variable block directly onto an existing one (see FlowchartBoard's
// handleDrop) merges it in as another entry instead of stacking a second
// block, so `int a = 1; int b = 2;` can live in one node.
export interface DeclareNodeData extends Record<string, unknown> {
  blockType: 'declare';
  label: string;
  entries: DeclarationEntry[];
}

// A Process/Output block can likewise print several variables — see the
// "+ Add variable" control in ProcessNode.svelte — each producing its own
// `System.out.println(...)` line from the one block.
export interface ProcessNodeData extends Record<string, unknown> {
  blockType: 'process';
  label: string;
  statements: string[];
}

// A Decision block branches: it has two source handles ("true"/"false"),
// each allowed exactly one outgoing edge (see pruneOutgoingEdgeForHandle),
// instead of the one-outgoing-edge-total rule every other block follows.
export interface DecisionNodeData extends Record<string, unknown> {
  blockType: 'decision';
  label: string;
  condition: string;
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  /** Visually present in the palette, but not functionally wired yet (Phase 2). */
  comingSoon?: boolean;
  /** Only one of this block is allowed on the canvas at a time — the palette chip disables itself once one already exists (see BlockPalette.svelte). */
  singleton?: boolean;
}

// End is listed last since it's the natural "you're done" block to reach
// for once the rest is built.
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: 'start', label: 'Start', singleton: true },
  { type: 'declare', label: 'Variable' },
  { type: 'process', label: 'Output' },
  { type: 'decision', label: 'Decision' },
  { type: 'forLoop', label: 'For Loop', comingSoon: true },
  { type: 'whileLoop', label: 'While Loop', comingSoon: true },
  { type: 'end', label: 'End', singleton: true },
];

const XYFLOW_NODE_TYPE: Partial<Record<BlockType, string>> = {
  start: 'input',
  end: 'output',
  process: 'process',
};

// Content blocks (Declare/Process/loop placeholders) all share this width,
// so lining them up by their left edge (auto-connect, Arrange) also lines
// them up by their center. Start/End are their own, narrower width — they
// only ever hold a short "Start"/"End" label, so stretching them to match
// would look oddly elongated. Anywhere blocks of different widths need to
// share a column (Arrange, the code-sync auto-connect) has to align by
// *center*, not shared x, to account for this — see nodeWidthFor below.
export const BLOCK_WIDTH = 260;
export const TERMINAL_WIDTH = 140;
export const DIAMOND_WIDTH = 200;
const DIAMOND_HEIGHT = 110;

const NODE_WIDTH: Record<BlockType, number> = {
  start: TERMINAL_WIDTH,
  end: TERMINAL_WIDTH,
  process: BLOCK_WIDTH,
  declare: BLOCK_WIDTH,
  forLoop: BLOCK_WIDTH,
  decision: DIAMOND_WIDTH,
  whileLoop: BLOCK_WIDTH,
};

// The width to lay a block out with before it exists yet (e.g. sizing a
// drop target under the cursor).
export function nodeWidthForType(type: BlockType): number {
  return NODE_WIDTH[type];
}

// An existing node's width — xyflow's own measurement once it's rendered
// (in case a node type's real size ever drifts from its nominal width),
// falling back to the nominal width for a node that hasn't been measured
// yet (e.g. one just created this tick).
export function nodeWidthFor(node: Node): number {
  const type = (node.data?.blockType as BlockType | undefined) ?? 'declare';
  return node.measured?.width ?? NODE_WIDTH[type];
}

// Shared with ShapeFrame.svelte (ProcessNode's parallelogram, DecisionNode's
// diamond) and BlockPalette.svelte's matching preview chips, so the canvas
// shape and its palette preview never drift out of sync.
export const PARALLELOGRAM_CLIP_PATH = 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)';
export const DIAMOND_CLIP_PATH = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

const BASE_NODE_STYLE = `width: ${BLOCK_WIDTH}px;`;
const TERMINAL_NODE_STYLE = `width: ${TERMINAL_WIDTH}px;`;
// Decision is a custom component (diamond via clip-path, see
// DecisionNode.svelte), so it needs an explicit height too — a rectangle's
// height just grows to fit its content, but a diamond's usable center area
// is much smaller than its bounding box.
const DIAMOND_NODE_STYLE = `width: ${DIAMOND_WIDTH}px; height: ${DIAMOND_HEIGHT}px;`;

// Flowchart terminal symbol: fully rounded (pill/stadium) left and right.
const PILL_STYLE = `${TERMINAL_NODE_STYLE} border-radius: 9999px; padding: 8px 16px; text-align: center;`;

// decision's entry here is never actually read (createBlockNode short-
// circuits to createDecisionNode before reaching it) — kept only so this
// object satisfies Record<BlockType, string>.
const XYFLOW_NODE_STYLE: Record<BlockType, string> = {
  start: PILL_STYLE,
  end: PILL_STYLE,
  process: BASE_NODE_STYLE,
  declare: BASE_NODE_STYLE,
  forLoop: BASE_NODE_STYLE,
  decision: DIAMOND_NODE_STYLE,
  whileLoop: BASE_NODE_STYLE,
};

let nodeCounter = 0;

// Kept separate from nodeCounter (used for node IDs) — Start already
// consumes nodeCounter's first value on every fresh canvas, so a shared
// counter would make the first variable a user actually declares default
// to `var2` instead of `var1`.
let varNameCounter = 0;

function nextDefaultVarName(): string {
  varNameCounter += 1;
  return `var${varNameCounter}`;
}

export function createBlockNode(type: BlockType, position: { x: number; y: number }): Node {
  const definition = BLOCK_DEFINITIONS.find((block) => block.type === type);
  if (!definition) throw new Error(`Unknown block type: ${type}`);

  if (type === 'process') return createProcessNode(position, '');
  if (type === 'declare') return createDeclareNode(position);
  if (type === 'decision') return createDecisionNode(position);

  nodeCounter += 1;
  const label = definition.comingSoon ? `${definition.label} (soon)` : definition.label;

  return {
    id: `${type}-${nodeCounter}`,
    type: XYFLOW_NODE_TYPE[type],
    data: { label, blockType: type },
    position,
    style: XYFLOW_NODE_STYLE[type],
    class: definition.comingSoon ? 'opacity-50' : undefined,
  };
}

export function statementsLabel(statements: string[]): string {
  return statements.filter(Boolean).join('; ');
}

export function createProcessNode(position: { x: number; y: number }, statement: string): Node {
  nodeCounter += 1;
  return {
    id: `process-${nodeCounter}`,
    type: 'process',
    data: { blockType: 'process', label: statementsLabel([statement]), statements: [statement] },
    position,
    style: BASE_NODE_STYLE,
  };
}

// Appends another (initially blank) statement slot to an existing Process
// block's own "+ Add variable" control — filled in once the user picks a
// variable from that row's dropdown.
export function addProcessStatement(node: Node): Node {
  const data = node.data as Partial<ProcessNodeData>;
  const statements = [...(data.statements ?? []), ''];
  return { ...node, data: { ...node.data, statements, label: statementsLabel(statements) } };
}

export function updateProcessStatementAt(node: Node, index: number, statement: string): Node {
  const data = node.data as Partial<ProcessNodeData>;
  const statements = [...(data.statements ?? [])];
  statements[index] = statement;
  return { ...node, data: { ...node.data, statements, label: statementsLabel(statements) } };
}

export function removeProcessStatementAt(node: Node, index: number): Node {
  const data = node.data as Partial<ProcessNodeData>;
  const statements = (data.statements ?? []).filter((_, i) => i !== index);
  return { ...node, data: { ...node.data, statements, label: statementsLabel(statements) } };
}

// Matches any `System.out.println(...)` statement, capturing whatever's
// inside the parens — a variable name, a literal ("Hello", 5), or an
// expression — so the Process node's row can tell whether it's printing a
// known variable (show the dropdown) or a literal/expression (show a text
// field), versus some other statement typed directly in the editor that its
// picker can't represent at all (shown read-only). Returns null for that
// last case — anything not shaped like a println call.
const PRINTLN_PATTERN = /^System\.out\.println\((.*)\)$/;

export function printlnContent(statement: string): string | null {
  const match = statement.match(PRINTLN_PATTERN);
  return match ? match[1] : null;
}

export function printlnStatement(varName: string): string {
  return `System.out.println(${varName})`;
}

export function createDecisionNode(position: { x: number; y: number }, condition = ''): Node {
  nodeCounter += 1;
  return {
    id: `decision-${nodeCounter}`,
    type: 'decision',
    data: { blockType: 'decision', label: condition, condition },
    position,
    style: DIAMOND_NODE_STYLE,
  };
}

export function updateDecisionCondition(node: Node, condition: string): Node {
  return { ...node, data: { ...node.data, condition, label: condition } };
}

export function declareLabel(varType: string, varName: string, varValue: string): string {
  return `${varType} ${varName} = ${varValue}`;
}

export function entriesLabel(entries: DeclarationEntry[]): string {
  return entries.map((e) => declareLabel(e.varType, e.varName, e.varValue)).join('; ');
}

export function createDeclareNode(
  position: { x: number; y: number },
  overrides?: { varType?: string; varName?: string; varValue?: string },
): Node {
  nodeCounter += 1;
  const entry: DeclarationEntry = {
    varType: overrides?.varType ?? 'int',
    varName: overrides?.varName ?? nextDefaultVarName(),
    varValue: overrides?.varValue ?? '0',
  };

  return {
    id: `declare-${nodeCounter}`,
    type: 'declare',
    data: { blockType: 'declare', label: entriesLabel([entry]), entries: [entry] },
    position,
    style: BASE_NODE_STYLE,
  };
}

// Appends another variable to an existing Declare block — used when a
// freshly dropped Variable block chains directly onto one (see
// FlowchartBoard's handleDrop), merging the two instead of stacking a
// second block.
export function addDeclarationEntry(node: Node, overrides?: { varType?: string; varName?: string; varValue?: string }): Node {
  const entry: DeclarationEntry = {
    varType: overrides?.varType ?? 'int',
    varName: overrides?.varName ?? nextDefaultVarName(),
    varValue: overrides?.varValue ?? '0',
  };
  const data = node.data as Partial<DeclareNodeData>;
  const entries = [...(data.entries ?? []), entry];
  return { ...node, data: { ...node.data, entries, label: entriesLabel(entries) } };
}

export function updateDeclarationEntryAt(
  node: Node,
  index: number,
  fields: { varType?: string; varName?: string; varValue?: string },
): Node {
  const data = node.data as Partial<DeclareNodeData>;
  const current = (data.entries ?? [])[index];
  const updated: DeclarationEntry = {
    varType: fields.varType ?? current?.varType ?? 'int',
    varName: fields.varName ?? current?.varName ?? 'value',
    varValue: fields.varValue ?? current?.varValue ?? '0',
  };
  const entries = [...(data.entries ?? [])];
  entries[index] = updated;
  return { ...node, data: { ...node.data, entries, label: entriesLabel(entries) } };
}

export function removeDeclarationEntryAt(node: Node, index: number): Node {
  const data = node.data as Partial<DeclareNodeData>;
  const entries = (data.entries ?? []).filter((_, i) => i !== index);
  return { ...node, data: { ...node.data, entries, label: entriesLabel(entries) } };
}

// x is offset clear of the BlockPalette, which floats over the canvas's
// top-left corner (see BlockPalette.svelte) — starting Start underneath it
// would leave it permanently hidden behind the palette panel.
export const DEFAULT_CANVAS_X = 320;

function createDefaultNodes(): Node[] {
  return [createBlockNode('start', { x: DEFAULT_CANVAS_X, y: 50 })];
}

export const nodes = writable<Node[]>(createDefaultNodes());
export const edges = writable<Edge[]>([]);

// Powers the "New" button — wipes the canvas back to a single fresh Start
// block. The code panel clears itself too, since it's just a reactive
// projection of the node list (see stores/sync.ts).
export function resetFlowchart() {
  nodes.set(createDefaultNodes());
  edges.set([]);
}

// True once the canvas differs from the default "just a Start block" state —
// used to warn before an accidental refresh/close discards the work, since
// there's no save/load yet (see CLAUDE.md > Next Steps).
export const isFlowchartDirty = derived(
  [nodes, edges],
  ([$nodes, $edges]) => $nodes.length > 1 || $edges.length > 0,
);

// Gates the Run button — a program without a *connected* End block isn't
// considered "finished" yet, mirroring the flowchart-validation rules in
// CLAUDE.md (warn if no Start/End block). An End block just sitting
// unconnected on the canvas doesn't count.
export const hasConnectedEndBlock = derived([nodes, edges], ([$nodes, $edges]) => {
  const endIds = new Set($nodes.filter((node) => node.data?.blockType === 'end').map((node) => node.id));
  if (endIds.size === 0) return false;
  return $edges.some((edge) => endIds.has(edge.target));
});

// Variable names available to a specific Output block — only ones declared
// in a Declare block somewhere upstream of it (connected via edges, walking
// backward through every incoming edge — a merge point after a Decision can
// have more than one), not just anywhere on the canvas. A block sitting
// unconnected, or declared only on a branch that doesn't lead here, doesn't
// count: the printed variable should always be one Java would actually see
// by the time this block runs.
export function declaredVariableNamesUpstreamOf(nodeId: string, nodeList: Node[], edgeList: Edge[]): string[] {
  const nodesById = new Map(nodeList.map((node) => [node.id, node]));
  const names: string[] = [];
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
      if (sourceNode?.data?.blockType !== 'declare') continue;
      for (const entry of (sourceNode.data as Partial<DeclareNodeData>).entries ?? []) {
        if (entry.varName && !seenNames.has(entry.varName)) {
          seenNames.add(entry.varName);
          names.push(entry.varName);
        }
      }
    }
  }

  return names;
}

// Bottom-most node currently on the canvas, i.e. the most natural place for
// a freshly dropped block to chain onto. Excludes End blocks (no outgoing
// handle) and Decision blocks (two branch handles — auto-connect can't know
// which one the user means, so they have to wire it manually).
export function bottomMostNodeId(nodeList: Node[]): string | null {
  const candidates = nodeList.filter((node) => {
    const type = node.data?.blockType;
    return type !== 'end' && type !== 'decision';
  });
  if (candidates.length === 0) return null;

  return candidates.reduce((lowest, node) => (node.position.y > lowest.position.y ? node : lowest)).id;
}

// A block's outgoing line can't branch: connecting its source handle to a
// new target — by manual drag or by an auto-connect — replaces whatever it
// previously pointed to instead of adding a second line out of the block.
export function pruneOutgoingEdge(edgeList: Edge[], sourceId: string): Edge[] {
  return edgeList.filter((edge) => edge.source !== sourceId);
}

// Decision blocks are the one exception to the single-outgoing-edge rule:
// each of their two handles ("true"/"false") is allowed one outgoing edge
// of its own, so connecting one branch doesn't disturb the other.
export function pruneOutgoingEdgeForHandle(
  edgeList: Edge[],
  sourceId: string,
  sourceHandle: string | null | undefined,
): Edge[] {
  return edgeList.filter((edge) => !(edge.source === sourceId && edge.sourceHandle === sourceHandle));
}

// A single-row block's rendered height — used both as the Arrange fallback
// for a node xyflow hasn't measured yet, and to center a freshly dropped
// block under the cursor (new blocks always start single-row).
export const DEFAULT_BLOCK_HEIGHT = 46;
const ARRANGE_GAP = 30;

// Lines every node up into a single straight column, in their current
// top-to-bottom order (same y-based ordering bottomMostNodeId uses) — the
// "Arrange" button/shortcut, for when drags and auto-connects have left the
// layout looking scattered. Spacing is based on each node's own measured
// height (Declare/Process blocks grow taller with more entries/statements),
// not a fixed gap — otherwise a multi-row block would visually overlap or
// crowd whatever comes right after it. Aligned by *center*, not a shared x —
// Start/End are narrower than everything else (see NODE_WIDTH), so sharing
// an x would leave them looking off-center against the rest of the column.
export function arrangeNodesVertically(nodeList: Node[]): Node[] {
  if (nodeList.length === 0) return nodeList;

  const sorted = [...nodeList].sort((a, b) => a.position.y - b.position.y);
  const centerX = sorted[0].position.x + nodeWidthFor(sorted[0]) / 2;

  const positionById = new Map<string, { x: number; y: number }>();
  let y = sorted[0].position.y;
  for (const node of sorted) {
    positionById.set(node.id, { x: centerX - nodeWidthFor(node) / 2, y });
    y += (node.measured?.height ?? DEFAULT_BLOCK_HEIGHT) + ARRANGE_GAP;
  }

  return nodeList.map((node) => ({ ...node, position: positionById.get(node.id)! }));
}

export function duplicateNodeById(nodeId: string) {
  nodes.update((current) => {
    const original = current.find((node) => node.id === nodeId);
    if (!original) return current;

    nodeCounter += 1;
    const prefix = (original.data?.blockType as string | undefined) ?? 'node';
    const copy: Node = {
      ...original,
      id: `${prefix}-${nodeCounter}`,
      position: { x: original.position.x + 30, y: original.position.y + 30 },
      selected: false,
    };
    return [...current, copy];
  });
}

export function deleteNodeById(nodeId: string) {
  nodes.update((current) => current.filter((node) => node.id !== nodeId));
  edges.update((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
}

export function deleteEdgeById(edgeId: string) {
  edges.update((current) => current.filter((edge) => edge.id !== edgeId));
}
