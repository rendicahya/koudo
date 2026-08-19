import type { Edge, Node } from '@xyflow/svelte';
import { derived, writable } from 'svelte/store';
import { outgoing, findMergePoint, branchHandlesOf, unusedBranchHandle } from '../lib/flowchart/graphWalk';

export type BlockType = 'start' | 'end' | 'process' | 'declare' | 'assign' | 'input' | 'forLoop' | 'decision' | 'whileLoop';

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

export interface AssignmentEntry {
  varName: string;
  operator: '=' | '+=' | '-=' | '*=' | '/=';
  value: string;
}

// An Assign block can hold several assignments at once, same "+ Add" /
// multi-row pattern as Declare and Process. Unlike Declare, it doesn't
// introduce a variable — it targets one that's already in scope, so its
// dropdown is scoped the same way Output's is (see
// declaredVariableNamesUpstreamOf).
export interface AssignNodeData extends Record<string, unknown> {
  blockType: 'assign';
  label: string;
  entries: AssignmentEntry[];
}

export interface InputEntry {
  varName: string;
  prompt: string;
}

// An Input block reads a value from the user into an already-declared
// variable — the flowchart Input/Output symbol (parallelogram, same as
// Output) used for the "in" direction. Its target dropdown is scoped the
// same way Output's and Assign's are (declaredVariableNamesUpstreamOf);
// code generation picks the right Scanner method (nextInt/nextDouble/...)
// from the target's declared type (see declaredVariableEntriesUpstreamOf).
export interface InputNodeData extends Record<string, unknown> {
  blockType: 'input';
  label: string;
  entries: InputEntry[];
}

// A Decision block branches: it has two source handles ("true"/"false"),
// each allowed exactly one outgoing edge (see pruneOutgoingEdgeForHandle),
// instead of the one-outgoing-edge-total rule every other block follows.
export interface DecisionNodeData extends Record<string, unknown> {
  blockType: 'decision';
  label: string;
  condition: string;
}

// A For Loop block branches like Decision (two source handles, one edge
// each — see graphWalk.ts's branchHandlesOf), but the two handles mean
// something different: 'loop' leads into the body, which the user wires
// back to this same node to close the loop (a real cycle in the edge
// graph — see generator.ts's walk() and stores/stepRunner.ts for how each
// side copes with that without needing to detect or reject cycles in
// general), and 'exit' is just "what comes after," not a branch to
// reconverge with.
export interface ForLoopNodeData extends Record<string, unknown> {
  blockType: 'forLoop';
  label: string;
  init: string;
  condition: string;
  update: string;
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
  { type: 'assign', label: 'Assign' },
  { type: 'input', label: 'Input' },
  { type: 'process', label: 'Output' },
  { type: 'decision', label: 'Decision' },
  { type: 'forLoop', label: 'For Loop' },
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
// For Loop uses the hexagon "Preparation"/loop-control symbol, not
// Decision's diamond — a diamond only has full width right at its vertical
// center and tapers to a single point above and below, which comfortably
// fits Decision's one condition line but would clip the top and bottom of a
// row of init/condition/update fields against the taper. The hexagon (see
// PREPARATION_CLIP_PATH below) has flat top/bottom edges — like a normal
// block, just with its left/right corners cut off — so the row sits flush
// against them instead of getting clipped. Wider than a normal block since
// the three fields sit side by side rather than stacked.
export const FORLOOP_WIDTH = BLOCK_WIDTH + 60;
const FORLOOP_HEIGHT = 90;

const NODE_WIDTH: Record<BlockType, number> = {
  start: TERMINAL_WIDTH,
  end: TERMINAL_WIDTH,
  process: BLOCK_WIDTH,
  declare: BLOCK_WIDTH,
  assign: BLOCK_WIDTH,
  input: BLOCK_WIDTH,
  forLoop: FORLOOP_WIDTH,
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
// diamond, ForLoopNode's hexagon) and BlockPalette.svelte's matching preview
// chips, so the canvas shape and its palette preview never drift out of sync.
export const PARALLELOGRAM_CLIP_PATH = 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)';
export const DIAMOND_CLIP_PATH = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
// Flowchart "Preparation"/loop-control symbol: flat top and bottom edges
// (holds multiple stacked rows exactly like a plain block does), corners cut
// off into shallow points on the left and right — the same silhouette a
// diamond gets *at* its vertical center, just held for the block's whole
// height instead of tapering to nothing above and below it.
export const PREPARATION_CLIP_PATH = 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)';

const BASE_NODE_STYLE = `width: ${BLOCK_WIDTH}px;`;
const TERMINAL_NODE_STYLE = `width: ${TERMINAL_WIDTH}px;`;
// Decision is a custom component (diamond via clip-path, see
// DecisionNode.svelte), so it needs an explicit height too — a rectangle's
// height just grows to fit its content, but a diamond's usable center area
// is much smaller than its bounding box.
const DIAMOND_NODE_STYLE = `width: ${DIAMOND_WIDTH}px; height: ${DIAMOND_HEIGHT}px;`;
const FORLOOP_NODE_STYLE = `width: ${FORLOOP_WIDTH}px; height: ${FORLOOP_HEIGHT}px;`;

// Flowchart terminal symbol: fully rounded (pill/stadium) left and right.
const PILL_STYLE = `${TERMINAL_NODE_STYLE} border-radius: 9999px; padding: 8px 16px; text-align: center;`;

// decision's, input's, and forLoop's entries here are never actually read
// (createBlockNode short-circuits to their own createXNode before reaching
// this) — kept only so this object satisfies Record<BlockType, string>.
const XYFLOW_NODE_STYLE: Record<BlockType, string> = {
  start: PILL_STYLE,
  end: PILL_STYLE,
  process: BASE_NODE_STYLE,
  declare: BASE_NODE_STYLE,
  assign: BASE_NODE_STYLE,
  input: BASE_NODE_STYLE,
  forLoop: FORLOOP_NODE_STYLE,
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

// After Open Project loads a saved flow, these counters must resume above
// whatever's already in it — otherwise the next block dropped in could mint
// an id (`${type}-${n}`, see createBlockNode) or default variable name
// (`varN`, see nextDefaultVarName) that collides with one the loaded file
// already uses. Best-effort for var names: only catches the `varN` pattern
// nextDefaultVarName itself generates, not names the user typed by hand.
function resyncCountersAfterLoad(nodeList: Node[]) {
  for (const node of nodeList) {
    const idMatch = /-(\d+)$/.exec(node.id);
    if (idMatch) nodeCounter = Math.max(nodeCounter, Number(idMatch[1]));

    const entries = (node.data as { entries?: { varName?: string }[] } | undefined)?.entries;
    for (const entry of entries ?? []) {
      const varMatch = /^var(\d+)$/.exec(entry.varName ?? '');
      if (varMatch) varNameCounter = Math.max(varNameCounter, Number(varMatch[1]));
    }
  }
}

// Declare/Assign/Input/Process blocks all follow the same shape: their data
// holds a list (named `entries`, or `statements` for Process) that can grow
// ("+ Add ..."), shrink (the row's own × button), or be edited positionally
// by index — with the block's label always kept as a recomputed join of the
// current list. These four generic helpers are that shared shape; each
// block type below wraps them with its own list key, label function, and
// (for Declare/Assign/Input) its own per-entry defaults.
interface ListBlockConfig<T> {
  blockType: BlockType;
  /** xyflow's own node.type, if different from blockType (see INPUT_XYFLOW_TYPE below). */
  xyflowType?: string;
  dataKey: 'entries' | 'statements';
  label: (list: T[]) => string;
}

function listOf<T>(node: Node, dataKey: ListBlockConfig<T>['dataKey']): T[] {
  return ((node.data as Record<string, unknown>)[dataKey] as T[] | undefined) ?? [];
}

function withList<T>(node: Node, config: ListBlockConfig<T>, list: T[]): Node {
  return { ...node, data: { ...node.data, [config.dataKey]: list, label: config.label(list) } };
}

function createListNode<T>(config: ListBlockConfig<T>, position: { x: number; y: number }, item: T): Node {
  nodeCounter += 1;
  return {
    id: `${config.blockType}-${nodeCounter}`,
    type: config.xyflowType ?? config.blockType,
    data: { blockType: config.blockType, [config.dataKey]: [item], label: config.label([item]) },
    position,
    style: BASE_NODE_STYLE,
  };
}

function addListItem<T>(config: ListBlockConfig<T>, node: Node, item: T): Node {
  return withList(node, config, [...listOf<T>(node, config.dataKey), item]);
}

function updateListItemAt<T>(config: ListBlockConfig<T>, node: Node, index: number, item: T): Node {
  const list = [...listOf<T>(node, config.dataKey)];
  list[index] = item;
  return withList(node, config, list);
}

function removeListItemAt<T>(config: ListBlockConfig<T>, node: Node, index: number): Node {
  return withList(node, config, listOf<T>(node, config.dataKey).filter((_, i) => i !== index));
}

export function createBlockNode(type: BlockType, position: { x: number; y: number }): Node {
  const definition = BLOCK_DEFINITIONS.find((block) => block.type === type);
  if (!definition) throw new Error(`Unknown block type: ${type}`);

  if (type === 'process') return createProcessNode(position, '');
  if (type === 'declare') return createDeclareNode(position);
  if (type === 'assign') return createAssignNode(position);
  if (type === 'input') return createInputNode(position);
  if (type === 'decision') return createDecisionNode(position);
  if (type === 'forLoop') return createForLoopNode(position);

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

const PROCESS_LIST: ListBlockConfig<string> = { blockType: 'process', dataKey: 'statements', label: statementsLabel };

export function createProcessNode(position: { x: number; y: number }, statement: string): Node {
  return createListNode(PROCESS_LIST, position, statement);
}

// Appends another (initially blank) statement slot to an existing Process
// block's own "+ Add variable" control — filled in once the user picks a
// variable from that row's dropdown.
export function addProcessStatement(node: Node): Node {
  return addListItem(PROCESS_LIST, node, '');
}

export function updateProcessStatementAt(node: Node, index: number, statement: string): Node {
  return updateListItemAt(PROCESS_LIST, node, index, statement);
}

export function removeProcessStatementAt(node: Node, index: number): Node {
  return removeListItemAt(PROCESS_LIST, node, index);
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

export function forLoopLabel(init: string, condition: string, update: string): string {
  return `for (${init}; ${condition}; ${update})`;
}

// Seeded with a runnable skeleton (matching Declare's `int var1 = 0`
// precedent) rather than blank fields — a beginner dropping this block
// should see a working loop immediately, not three empty inputs and a
// syntax error.
export function createForLoopNode(position: { x: number; y: number }): Node {
  nodeCounter += 1;
  const init = 'int i = 0';
  const condition = 'i < 10';
  const update = 'i++';

  return {
    id: `forLoop-${nodeCounter}`,
    type: 'forLoop',
    data: { blockType: 'forLoop', label: forLoopLabel(init, condition, update), init, condition, update },
    position,
    style: FORLOOP_NODE_STYLE,
  };
}

export function updateForLoopField(node: Node, field: 'init' | 'condition' | 'update', value: string): Node {
  const data = node.data as Partial<ForLoopNodeData>;
  const init = field === 'init' ? value : (data.init ?? '');
  const condition = field === 'condition' ? value : (data.condition ?? '');
  const update = field === 'update' ? value : (data.update ?? '');
  return { ...node, data: { ...node.data, init, condition, update, label: forLoopLabel(init, condition, update) } };
}

export function declareLabel(varType: string, varName: string, varValue: string): string {
  return `${varType} ${varName} = ${varValue}`;
}

export function entriesLabel(entries: DeclarationEntry[]): string {
  return entries.map((e) => declareLabel(e.varType, e.varName, e.varValue)).join('; ');
}

const DECLARE_LIST: ListBlockConfig<DeclarationEntry> = { blockType: 'declare', dataKey: 'entries', label: entriesLabel };

function defaultDeclarationEntry(overrides?: { varType?: string; varName?: string; varValue?: string }): DeclarationEntry {
  return {
    varType: overrides?.varType ?? 'int',
    varName: overrides?.varName ?? nextDefaultVarName(),
    varValue: overrides?.varValue ?? '0',
  };
}

export function createDeclareNode(
  position: { x: number; y: number },
  overrides?: { varType?: string; varName?: string; varValue?: string },
): Node {
  return createListNode(DECLARE_LIST, position, defaultDeclarationEntry(overrides));
}

// Appends another variable to an existing Declare block — used when a
// freshly dropped Variable block chains directly onto one (see
// FlowchartBoard's handleDrop), merging the two instead of stacking a
// second block.
export function addDeclarationEntry(node: Node, overrides?: { varType?: string; varName?: string; varValue?: string }): Node {
  return addListItem(DECLARE_LIST, node, defaultDeclarationEntry(overrides));
}

export function updateDeclarationEntryAt(
  node: Node,
  index: number,
  fields: { varType?: string; varName?: string; varValue?: string },
): Node {
  const current = listOf<DeclarationEntry>(node, 'entries')[index];
  const updated: DeclarationEntry = {
    varType: fields.varType ?? current?.varType ?? 'int',
    varName: fields.varName ?? current?.varName ?? 'value',
    varValue: fields.varValue ?? current?.varValue ?? '0',
  };
  return updateListItemAt(DECLARE_LIST, node, index, updated);
}

export function removeDeclarationEntryAt(node: Node, index: number): Node {
  return removeListItemAt(DECLARE_LIST, node, index);
}

export function assignmentLabel(entry: AssignmentEntry): string {
  return `${entry.varName} ${entry.operator} ${entry.value}`;
}

export function assignEntriesLabel(entries: AssignmentEntry[]): string {
  return entries.map(assignmentLabel).join('; ');
}

const ASSIGN_LIST: ListBlockConfig<AssignmentEntry> = { blockType: 'assign', dataKey: 'entries', label: assignEntriesLabel };

function defaultAssignmentEntry(overrides?: Partial<AssignmentEntry>): AssignmentEntry {
  return {
    varName: overrides?.varName ?? '',
    operator: overrides?.operator ?? '=',
    value: overrides?.value ?? '',
  };
}

export function createAssignNode(position: { x: number; y: number }, overrides?: Partial<AssignmentEntry>): Node {
  return createListNode(ASSIGN_LIST, position, defaultAssignmentEntry(overrides));
}

// Appends another (initially blank) assignment slot — the "+ Add
// assignment" control on the block itself, same pattern as Process's
// "+ Add output".
export function addAssignmentEntry(node: Node): Node {
  return addListItem(ASSIGN_LIST, node, defaultAssignmentEntry());
}

export function updateAssignmentEntryAt(node: Node, index: number, fields: Partial<AssignmentEntry>): Node {
  const current = listOf<AssignmentEntry>(node, 'entries')[index];
  const updated: AssignmentEntry = {
    varName: fields.varName ?? current?.varName ?? '',
    operator: fields.operator ?? current?.operator ?? '=',
    value: fields.value ?? current?.value ?? '',
  };
  return updateListItemAt(ASSIGN_LIST, node, index, updated);
}

export function removeAssignmentEntryAt(node: Node, index: number): Node {
  return removeListItemAt(ASSIGN_LIST, node, index);
}

function inputLabel(entry: InputEntry): string {
  return entry.prompt ? `${entry.varName} <- "${entry.prompt}"` : entry.varName;
}

function inputEntriesLabel(entries: InputEntry[]): string {
  return entries.map(inputLabel).join('; ');
}

// xyflow's own built-in node type is *also* called "input" (see
// XYFLOW_NODE_TYPE.start above) — using that same string for this block's
// node.type would make Start blocks render with this component instead of
// xyflow's plain terminal box. blockType stays 'input' everywhere else
// (BLOCK_DEFINITIONS, generator.ts, ...); only the xyflow-facing type
// differs.
const INPUT_XYFLOW_TYPE = 'userInput';

const INPUT_LIST: ListBlockConfig<InputEntry> = {
  blockType: 'input',
  xyflowType: INPUT_XYFLOW_TYPE,
  dataKey: 'entries',
  label: inputEntriesLabel,
};

function defaultInputEntry(overrides?: Partial<InputEntry>): InputEntry {
  return {
    varName: overrides?.varName ?? '',
    prompt: overrides?.prompt ?? '',
  };
}

export function createInputNode(position: { x: number; y: number }, overrides?: Partial<InputEntry>): Node {
  return createListNode(INPUT_LIST, position, defaultInputEntry(overrides));
}

// Appends another (initially blank) input slot — the "+ Add input" control
// on the block itself, same pattern as Process/Assign's "+ Add" controls.
export function addInputEntry(node: Node): Node {
  return addListItem(INPUT_LIST, node, defaultInputEntry());
}

export function updateInputEntryAt(node: Node, index: number, fields: Partial<InputEntry>): Node {
  const current = listOf<InputEntry>(node, 'entries')[index];
  const updated: InputEntry = {
    varName: fields.varName ?? current?.varName ?? '',
    prompt: fields.prompt ?? current?.prompt ?? '',
  };
  return updateListItemAt(INPUT_LIST, node, index, updated);
}

export function removeInputEntryAt(node: Node, index: number): Node {
  return removeListItemAt(INPUT_LIST, node, index);
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

// Powers Open Project — replaces the canvas with a previously Saved one
// (see lib/storage/flowchartFile.ts for the file's shape/parsing).
export function loadFlowchart(nodeList: Node[], edgeList: Edge[]) {
  resyncCountersAfterLoad(nodeList);
  nodes.set(nodeList);
  edges.set(edgeList);
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

// Re-exported from graphWalk.ts (the pure-logic home for this, shared with
// generator.ts's own type lookups) so existing component imports from
// './flowchart' keep working unchanged.
export {
  declaredVariableEntriesUpstreamOf,
  declaredVariableNamesUpstreamOf,
  branchHandlesOf,
  unusedBranchHandle,
} from '../lib/flowchart/graphWalk';

// Bottom-most node currently on the canvas, i.e. the most natural place for
// a freshly dropped block to chain onto. Excludes End blocks (no outgoing
// handle). A branching block (Decision, ForLoop) is only a candidate when
// edgeList is given and it still has a free handle (see
// graphWalk.ts's unusedBranchHandle) — that's how one sitting at the bottom
// of the flow still gets auto-connected to instead of being skipped in
// favor of whatever's above it. Callers that don't pass edgeList (sync.ts's
// code->flowchart reconciliation, which only ever chains a single plain
// edge and has no notion of branches) keep excluding branching blocks
// entirely, same as before.
export function bottomMostNodeId(nodeList: Node[], edgeList?: Edge[]): string | null {
  const candidates = nodeList.filter((node) => {
    const type = node.data?.blockType as string | undefined;
    if (type === 'end') return false;
    if (branchHandlesOf(type)) return edgeList !== undefined && unusedBranchHandle(node, edgeList) !== null;
    return true;
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
// Horizontal spacing between a Decision's False-branch column and whatever
// column it branched off from.
const ARRANGE_BRANCH_GAP = 40;

// Arranges the flow along its actual edges (not just current y-position),
// so Decision blocks branch into two side-by-side columns instead of
// getting flattened into one straight line with everything else — the
// "Arrange" button/shortcut, for when drags and auto-connects have left the
// layout looking scattered.
//
// The True branch continues straight down in the same column as the
// Decision; the False branch gets its own column to the right. Both
// branches are walked recursively (so a Decision nested inside a branch
// gets its own further-right column, never colliding with an outer
// Decision's own False column) and, if they reconverge (see
// graphWalk's findMergePoint), the walk continues as one column again from
// there. Nodes not reachable from Start at all (disconnected from the
// flow) are stacked in a plain column below everything else, same as this
// function's previous straight-line-only behavior.
export function arrangeNodesVertically(nodeList: Node[], edgeList: Edge[]): Node[] {
  if (nodeList.length === 0) return nodeList;

  const nodesById = new Map(nodeList.map((node) => [node.id, node]));
  const positionById = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  const startNode = nodeList.find((node) => node.data?.blockType === 'start') ?? nodeList[0];
  const originX = startNode.position.x + nodeWidthFor(startNode) / 2;
  const originY = startNode.position.y;
  let nextBranchColumn = 0;

  // Walks the chain from nodeId (in the column centered at centerX,
  // starting at y), stopping before stopId if given. Returns the y where
  // whatever comes next (after this chain, or after the branch pair this
  // chain belongs to) should be placed.
  function layout(nodeId: string | null, stopId: string | null, centerX: number, y: number): number {
    let currentId = nodeId;
    while (currentId && currentId !== stopId) {
      if (visited.has(currentId)) break; // cycle guard, matches generator.ts's walk()
      visited.add(currentId);

      const node = nodesById.get(currentId);
      if (!node) break;

      positionById.set(currentId, { x: centerX - nodeWidthFor(node) / 2, y });
      const nextY = y + (node.measured?.height ?? DEFAULT_BLOCK_HEIGHT) + ARRANGE_GAP;

      if (node.data?.blockType === 'decision') {
        const trueId = outgoing(edgeList, currentId, 'true');
        const falseId = outgoing(edgeList, currentId, 'false');
        const mergeId = findMergePoint(trueId, falseId, nodesById, edgeList);

        const trueBottomY = trueId ? layout(trueId, mergeId, centerX, nextY) : nextY;

        nextBranchColumn += 1;
        const falseX = originX + nextBranchColumn * (BLOCK_WIDTH + ARRANGE_BRANCH_GAP);
        const falseBottomY = falseId ? layout(falseId, mergeId, falseX, nextY) : nextY;

        y = Math.max(trueBottomY, falseBottomY);
        currentId = mergeId;
        continue;
      }

      // Unlike Decision, ForLoop only has one column to lay out: the body
      // stacks straight down from the diamond, in the very same column
      // (mirroring how the True branch continues straight down above) —
      // there's no second, divergent branch needing its own column, since
      // 'exit' isn't a parallel path to reconverge with, just "whatever's
      // next" once the body's done. stopId is the ForLoop node's own id,
      // so the body's layout walk stops the moment it reaches back around
      // the user-drawn loop-back edge, the same way generator.ts's walk()
      // stops there when emitting the `for (...) { ... }` block.
      if (node.data?.blockType === 'forLoop') {
        const bodyId = outgoing(edgeList, currentId, 'loop');
        y = bodyId ? layout(bodyId, currentId, centerX, nextY) : nextY;
        currentId = outgoing(edgeList, currentId, 'exit');
        continue;
      }

      y = nextY;
      currentId = outgoing(edgeList, currentId, null);
    }
    return y;
  }

  const afterFlowY = layout(startNode.id, null, originX, originY);

  // Anything the walk never reached (disconnected from Start) — stack
  // below everything else, in their original relative top-to-bottom order.
  const leftovers = nodeList.filter((node) => !visited.has(node.id)).sort((a, b) => a.position.y - b.position.y);
  let leftoverY = leftovers.length > 0 ? afterFlowY + 90 : afterFlowY;
  for (const node of leftovers) {
    positionById.set(node.id, { x: originX - nodeWidthFor(node) / 2, y: leftoverY });
    leftoverY += (node.measured?.height ?? DEFAULT_BLOCK_HEIGHT) + ARRANGE_GAP;
  }

  return nodeList.map((node) => ({ ...node, position: positionById.get(node.id) ?? node.position }));
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
