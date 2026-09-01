import type { Edge, Node } from '@xyflow/svelte';
import { derived, get, writable } from 'svelte/store';
import { outgoing, findMergePoint, branchHandlesOf, unusedBranchHandle, allDecisionBranchesReachEnd } from '../lib/flowchart/graphWalk';
import { formatDeclaredValue } from '../lib/flowchart/valueFormat';

export type BlockType =
  | 'start'
  | 'end'
  | 'process'
  | 'declare'
  | 'assign'
  | 'input'
  | 'forLoop'
  | 'decision'
  | 'whileLoop'
  | 'subroutineStart'
  | 'subroutineEnd'
  | 'subroutineCall';

export interface DeclarationEntry {
  varType: string;
  varName: string;
  varValue: string;
  // Emits Java's `final` modifier (see generator.ts's declare case) and
  // pseudocode's CONST keyword (see generatorPseudocode.ts) — the app
  // doesn't otherwise enforce write-once-ness (e.g. an Assign block can
  // still target a const's name), same "known gap" as its simplified
  // variable-scope tracking elsewhere (see declaredVariableEntriesUpstreamOf).
  isConst: boolean;
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

// A While Loop block branches the same way ForLoop does (see BRANCH_HANDLES
// above) — 'loop' into the body, wired back to this same node to close the
// loop, 'exit' as whatever comes after — just with only a condition, no
// init/update clause. Rendered as a diamond (same shape as Decision, see
// WhileLoopNode.svelte) since a single condition line doesn't need the
// hexagon's flat top/bottom the way ForLoop's three fields do.
export interface WhileLoopNodeData extends Record<string, unknown> {
  blockType: 'whileLoop';
  label: string;
  condition: string;
}

// A parameter of a Subroutine Start block's own method signature — mirrors
// DeclarationEntry's varType/varName shape but named differently (paramType/
// paramName) since a parameter has no varValue of its own.
export interface SubroutineParam {
  paramType: string;
  paramName: string;
}

// One connected component elsewhere on the canvas, walked and generated as
// its own Java method (see generator.ts's subroutineMethods) — the flowchart
// notation for a Predefined Process/Subroutine, split across a matching
// Subroutine Start/Subroutine Call/Subroutine End trio the same way this
// app's main program is split across Start/blocks/End. returnType is 'void'
// or one of the same primitive/String types Declare's own type <select>
// offers — the actual return *value* lives on whichever Subroutine End(s)
// this Start's body reaches (see SubroutineEndNodeData), not here, since a
// branching body can have more than one.
export interface SubroutineStartNodeData extends Record<string, unknown> {
  blockType: 'subroutineStart';
  label: string;
  name: string;
  params: SubroutineParam[];
  returnType: string;
}

// Same role as the main flow's End block (just marks where this
// subroutine's body stops), but a distinct blockType so it isn't caught by
// the main flow's own End-specific checks (singleton, hasConnectedEndBlock
// — see stores/flowchart.ts and FlowchartBoard.svelte). returnValue is a
// free-typed expression, only shown/meaningful when the owning Subroutine
// Start's own returnType isn't 'void' (see SubroutineEndNode.svelte, which
// resolves that ownership via graphWalk.ts's subroutineStartUpstreamOf) —
// left blank for a void subroutine's End, same "not every field applies"
// convention as e.g. Declare's blank-value "declare only" state.
export interface SubroutineEndNodeData extends Record<string, unknown> {
  blockType: 'subroutineEnd';
  label: string;
  returnValue: string;
}

// A call site — placed in any flow (main's, or another subroutine's own
// body) to invoke a Subroutine Start elsewhere on the canvas. References its
// target by node id, not by name (see updateSubroutineCallTarget below) —
// renaming the target's method name shouldn't silently orphan every call to
// it the way name-string matching would. resultVar optionally captures a
// non-void call's return value into an already-declared variable (same
// "target must already exist, no inline declaring" convention as Assign) —
// blank discards the return value, same as calling a Java method as a bare
// statement.
export interface SubroutineCallNodeData extends Record<string, unknown> {
  blockType: 'subroutineCall';
  label: string;
  targetId: string;
  args: string[];
  resultVar: string;
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
  { type: 'decision', label: 'If' },
  { type: 'forLoop', label: 'For' },
  { type: 'whileLoop', label: 'While' },
  { type: 'subroutineStart', label: 'Sub Start' },
  { type: 'subroutineCall', label: 'Call Sub' },
  { type: 'subroutineEnd', label: 'Sub End' },
  { type: 'end', label: 'End', singleton: true },
];

const XYFLOW_NODE_TYPE: Partial<Record<BlockType, string>> = {
  start: 'input',
  end: 'output',
  process: 'process',
};

// Declare/Process/Input all share this width, so lining them up by their
// left edge (auto-connect, Arrange) also lines them up by their center.
// Assign is its own, wider width (see ASSIGN_WIDTH below — its row packs
// more fields than the others). Start/End are their own, narrower width — they
// only ever hold a short "Start"/"End" label, so stretching them to match
// would look oddly elongated. Anywhere blocks of different widths need to
// share a column (Arrange, the code-sync auto-connect) has to align by
// *center*, not shared x, to account for this — see nodeWidthFor below.
export const BLOCK_WIDTH = 260;
// Declare's own, slightly wider width — its row can carry a type
// <select>/badge alongside the name and value fields (more so in Beginner
// mode, whose blank-value type picker needs its own room too), which
// crowds BLOCK_WIDTH a bit more than Process/Input's single field does. A
// much smaller bump than Assign's own +100 (see ASSIGN_WIDTH) — Declare's
// extra content is one compact badge/select, not a whole second editor.
// +40 for the type/name/value fields for a single line (see BLOCK_WIDTH),
// +40 more for the drag handle and const-checkbox controls added alongside
// each entry (see DeclareNode.svelte).
export const DECLARE_WIDTH = BLOCK_WIDTH + 110;
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
// Assign's row packs a target-variable select, an operator select, a
// from-variable/custom select, and (for a custom value) its own text/select
// editor all on one line — noticeably more than Declare/Process/Input's
// single field, so it needs more breathing room than BLOCK_WIDTH gives the
// rest of the plain rectangular blocks before that last editor gets crushed
// down to nothing.
export const ASSIGN_WIDTH = BLOCK_WIDTH + 100;
// Wider than the plain TERMINAL_WIDTH pill Start/End use — a Subroutine
// Start's own name + growing parameter list needs more room than a fixed
// "Start"/"End" label ever does.
export const SUBROUTINE_START_WIDTH = 200;

const NODE_WIDTH: Record<BlockType, number> = {
  start: TERMINAL_WIDTH,
  end: TERMINAL_WIDTH,
  process: BLOCK_WIDTH,
  declare: DECLARE_WIDTH,
  assign: ASSIGN_WIDTH,
  input: BLOCK_WIDTH,
  forLoop: FORLOOP_WIDTH,
  decision: DIAMOND_WIDTH,
  whileLoop: DIAMOND_WIDTH,
  subroutineStart: SUBROUTINE_START_WIDTH,
  subroutineEnd: TERMINAL_WIDTH,
  subroutineCall: BLOCK_WIDTH,
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
const DECLARE_NODE_STYLE = `width: ${DECLARE_WIDTH}px;`;
const ASSIGN_NODE_STYLE = `width: ${ASSIGN_WIDTH}px;`;
const TERMINAL_NODE_STYLE = `width: ${TERMINAL_WIDTH}px;`;
// Decision is a custom component (diamond via clip-path, see
// DecisionNode.svelte), so it needs an explicit height too — a rectangle's
// height just grows to fit its content, but a diamond's usable center area
// is much smaller than its bounding box.
const DIAMOND_NODE_STYLE = `width: ${DIAMOND_WIDTH}px; height: ${DIAMOND_HEIGHT}px;`;
const FORLOOP_NODE_STYLE = `width: ${FORLOOP_WIDTH}px; height: ${FORLOOP_HEIGHT}px;`;

// Flowchart terminal symbol: fully rounded (pill/stadium) left and right.
const PILL_STYLE = `${TERMINAL_NODE_STYLE} border-radius: 9999px; padding: 8px 16px; text-align: center;`;
// A softened rectangle (not a full pill — its name/parameter-list content
// grows the way a rectangular block's does, unlike Start/End's short fixed
// label) that still reads as "a terminal-ish, special block" rather than
// Process's sharp-cornered rectangle.
const SUBROUTINE_START_NODE_STYLE = `width: ${SUBROUTINE_START_WIDTH}px; border-radius: 14px;`;

// decision's, input's, forLoop's, whileLoop's, and every subroutine*
// entries here are never actually read (createBlockNode short-circuits to
// their own createXNode before reaching this) — kept only so this object
// satisfies Record<BlockType, string>.
const XYFLOW_NODE_STYLE: Record<BlockType, string> = {
  start: PILL_STYLE,
  end: PILL_STYLE,
  process: BASE_NODE_STYLE,
  declare: DECLARE_NODE_STYLE,
  assign: ASSIGN_NODE_STYLE,
  input: BASE_NODE_STYLE,
  forLoop: FORLOOP_NODE_STYLE,
  decision: DIAMOND_NODE_STYLE,
  whileLoop: DIAMOND_NODE_STYLE,
  subroutineStart: BASE_NODE_STYLE,
  subroutineEnd: PILL_STYLE,
  subroutineCall: BASE_NODE_STYLE,
};

let nodeCounter = 0;

// Every `varN` name already in use by some Declare entry currently on the
// canvas (across every Declare block, not just one) — scanned fresh from
// live state rather than tracked as a running counter, so deleting every
// declared variable and adding a new one starts back at `var1` instead of
// continuing on from a name nothing on the canvas uses anymore.
function usedDefaultVarNames(): Set<string> {
  const used = new Set<string>();
  for (const node of get(nodes)) {
    if (node.data?.blockType !== 'declare') continue;
    const entries = (node.data as Partial<DeclareNodeData>).entries ?? [];
    for (const entry of entries) {
      if (/^var\d+$/.test(entry.varName ?? '')) used.add(entry.varName);
    }
  }
  return used;
}

// The lowest-numbered `varN` not already in use — fills a gap left by a
// deleted variable rather than always climbing past every name ever used.
function nextDefaultVarName(): string {
  const used = usedDefaultVarNames();
  let n = 1;
  while (used.has(`var${n}`)) n++;
  return `var${n}`;
}

// After Open Project loads a saved flow, nodeCounter must resume above
// whatever's already in it — otherwise the next block dropped in could mint
// an id (`${type}-${n}`, see createBlockNode) that collides with one the
// loaded file already uses. Default variable names need no equivalent
// resync: nextDefaultVarName always reflects live state (see
// usedDefaultVarNames above), including whatever the loaded file brought in.
function resyncCountersAfterLoad(nodeList: Node[]) {
  for (const node of nodeList) {
    const idMatch = /-(\d+)$/.exec(node.id);
    if (idMatch) nodeCounter = Math.max(nodeCounter, Number(idMatch[1]));
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
  /** Defaults to BASE_NODE_STYLE — only Assign overrides it (see ASSIGN_NODE_STYLE). */
  style?: string;
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
    style: config.style ?? BASE_NODE_STYLE,
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

// Moves the item at fromIndex to sit at toIndex (drag-and-drop reordering —
// see DeclareNode.svelte's own pointer-based drag handle) — a no-op if
// either index is out of bounds or they're the same.
function reorderListItemAt<T>(config: ListBlockConfig<T>, node: Node, fromIndex: number, toIndex: number): Node {
  const list = [...listOf<T>(node, config.dataKey)];
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return node;
  const [item] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, item);
  return withList(node, config, list);
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
  if (type === 'whileLoop') return createWhileLoopNode(position);
  if (type === 'subroutineStart') return createSubroutineStartNode(position);
  if (type === 'subroutineEnd') return createSubroutineEndNode(position);
  if (type === 'subroutineCall') return createSubroutineCallNode(position);

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

// Reorders a Process block's own output lines via drag-and-drop (see
// ProcessNode.svelte's drag handle) — Java executes statements in source
// order, so this changes what's visible to earlier/later lines, not just
// cosmetic ordering.
export function reorderProcessStatements(node: Node, fromIndex: number, toIndex: number): Node {
  return reorderListItemAt(PROCESS_LIST, node, fromIndex, toIndex);
}

// Matches any `System.out.println(...)`/`System.out.print(...)` statement,
// capturing which of the two it is and whatever's inside the parens — a
// variable name, a literal ("Hello", 5), or an expression — so the Process
// node's row can tell whether it's printing a known variable (show the
// dropdown) or a literal/expression (show a text field), versus some other
// statement typed directly in the editor that its picker can't represent at
// all (shown read-only). Returns null for that last case — anything not
// shaped like a print/println call.
const PRINT_PATTERN = /^System\.out\.(println|print)\((.*)\)$/;

export function printlnContent(statement: string): string | null {
  const match = statement.match(PRINT_PATTERN);
  return match ? match[2] : null;
}

// Whether a print/println statement ends its output with a newline — the
// "print a newline after this" checkbox's own checked state (see
// ProcessNode.svelte). Defaults true (println) for a statement that isn't
// shaped like either call yet (e.g. a brand new blank row).
export function isPrintlnStatement(statement: string): boolean {
  const match = statement.match(PRINT_PATTERN);
  return match ? match[1] === 'println' : true;
}

export function printlnStatement(content: string, newline = true): string {
  return `System.out.${newline ? 'println' : 'print'}(${content})`;
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

export function whileLoopLabel(condition: string): string {
  return `while (${condition})`;
}

// Seeded with a runnable skeleton, same reasoning as createForLoopNode.
export function createWhileLoopNode(position: { x: number; y: number }): Node {
  nodeCounter += 1;
  const condition = 'i < 10';

  return {
    id: `whileLoop-${nodeCounter}`,
    type: 'whileLoop',
    data: { blockType: 'whileLoop', label: whileLoopLabel(condition), condition },
    position,
    style: DIAMOND_NODE_STYLE,
  };
}

export function updateWhileLoopCondition(node: Node, condition: string): Node {
  return { ...node, data: { ...node.data, condition, label: whileLoopLabel(condition) } };
}

// Every `methodN` name already in use by some Subroutine Start currently on
// the canvas — same "fill the lowest gap, scanned fresh from live state"
// approach as usedDefaultVarNames/nextDefaultVarName above.
function usedDefaultMethodNames(): Set<string> {
  const used = new Set<string>();
  for (const node of get(nodes)) {
    if (node.data?.blockType !== 'subroutineStart') continue;
    const name = (node.data as Partial<SubroutineStartNodeData>).name;
    if (name && /^method\d+$/.test(name)) used.add(name);
  }
  return used;
}

function nextDefaultMethodName(): string {
  const used = usedDefaultMethodNames();
  let n = 1;
  while (used.has(`method${n}`)) n++;
  return `method${n}`;
}

export function subroutineSignatureLabel(name: string, params: SubroutineParam[], returnType: string): string {
  const paramList = params.map((p) => `${p.paramType} ${p.paramName}`).join(', ');
  return `${returnType || 'void'} ${name || '?'}(${paramList})`;
}

export function createSubroutineStartNode(position: { x: number; y: number }): Node {
  nodeCounter += 1;
  const name = nextDefaultMethodName();
  const params: SubroutineParam[] = [];
  const returnType = 'void';

  return {
    id: `subroutineStart-${nodeCounter}`,
    type: 'subroutineStart',
    data: { blockType: 'subroutineStart', label: subroutineSignatureLabel(name, params, returnType), name, params, returnType },
    position,
    style: SUBROUTINE_START_NODE_STYLE,
  };
}

export function updateSubroutineName(node: Node, name: string): Node {
  const data = node.data as Partial<SubroutineStartNodeData>;
  const params = data.params ?? [];
  const returnType = data.returnType ?? 'void';
  return { ...node, data: { ...node.data, name, label: subroutineSignatureLabel(name, params, returnType) } };
}

export function updateSubroutineReturnType(node: Node, returnType: string): Node {
  const data = node.data as Partial<SubroutineStartNodeData>;
  return { ...node, data: { ...node.data, returnType, label: subroutineSignatureLabel(data.name ?? '', data.params ?? [], returnType) } };
}

export function addSubroutineParam(node: Node): Node {
  const data = node.data as Partial<SubroutineStartNodeData>;
  const params = [...(data.params ?? []), { paramType: 'int', paramName: `p${(data.params?.length ?? 0) + 1}` }];
  return { ...node, data: { ...node.data, params, label: subroutineSignatureLabel(data.name ?? '', params, data.returnType ?? 'void') } };
}

export function updateSubroutineParamAt(node: Node, index: number, fields: Partial<SubroutineParam>): Node {
  const data = node.data as Partial<SubroutineStartNodeData>;
  const params = [...(data.params ?? [])];
  const current = params[index] ?? { paramType: 'int', paramName: '' };
  params[index] = { ...current, ...fields };
  return { ...node, data: { ...node.data, params, label: subroutineSignatureLabel(data.name ?? '', params, data.returnType ?? 'void') } };
}

export function removeSubroutineParamAt(node: Node, index: number): Node {
  const data = node.data as Partial<SubroutineStartNodeData>;
  const params = (data.params ?? []).filter((_, i) => i !== index);
  return { ...node, data: { ...node.data, params, label: subroutineSignatureLabel(data.name ?? '', params, data.returnType ?? 'void') } };
}

export function createSubroutineEndNode(position: { x: number; y: number }): Node {
  nodeCounter += 1;
  return {
    id: `subroutineEnd-${nodeCounter}`,
    type: 'subroutineEnd',
    data: { blockType: 'subroutineEnd', label: 'End', returnValue: '' },
    position,
    // Same rounded-rectangle sizing as Subroutine Start (not the fixed-width
    // PILL_STYLE main End uses) — this one may need to grow to fit an
    // optional return-value field (see SubroutineEndNode.svelte), and a
    // Node's style is fixed at creation time, so it needs the room up front.
    style: SUBROUTINE_START_NODE_STYLE,
  };
}

export function updateSubroutineEndReturnValue(node: Node, returnValue: string): Node {
  return { ...node, data: { ...node.data, returnValue } };
}

// All Subroutine Start nodes currently on the canvas — the pool a Subroutine
// Call's own target dropdown is populated from (see SubroutineCallNode.svelte)
// and generator.ts walks to emit each one's own Java method. Global, not
// upstream-scoped the way declaredVariableNamesUpstreamOf is: any subroutine
// can call any other regardless of where either sits on the canvas, same as
// real Java methods can call each other in any order/position within a class.
export function subroutineStartNodes(nodeList: Node[]): Node[] {
  return nodeList.filter((node) => node.data?.blockType === 'subroutineStart');
}

export function subroutineCallLabel(targetName: string, args: string[], resultVar: string): string {
  const call = `${targetName || '?'}(${args.join(', ')})`;
  return resultVar ? `${resultVar} = ${call}` : call;
}

export function createSubroutineCallNode(position: { x: number; y: number }): Node {
  nodeCounter += 1;
  return {
    id: `subroutineCall-${nodeCounter}`,
    type: 'subroutineCall',
    data: { blockType: 'subroutineCall', label: subroutineCallLabel('', [], ''), targetId: '', args: [], resultVar: '' },
    position,
    style: BASE_NODE_STYLE,
  };
}

// Switching a Call block's target resets its argument list to match the new
// target's parameter count — an argument list sized for the previous
// target's signature has no meaningful mapping onto a different one — and
// clears resultVar, since it may no longer even apply (the new target could
// be void) or may no longer be the right type for it.
// targetName is passed in (rather than looked up here) since this function
// only ever sees the one node being updated, not the full node list its
// target actually lives in — same reason renameDeclaredVariable's callers
// resolve names before calling in, see that function's own comment.
export function updateSubroutineCallTarget(node: Node, targetId: string, targetName: string, paramCount: number): Node {
  const args = Array.from({ length: paramCount }, () => '');
  return { ...node, data: { ...node.data, targetId, args, resultVar: '', label: subroutineCallLabel(targetName, args, '') } };
}

export function updateSubroutineCallArgAt(node: Node, index: number, value: string, targetName: string): Node {
  const data = node.data as Partial<SubroutineCallNodeData>;
  const args = [...(data.args ?? [])];
  args[index] = value;
  return { ...node, data: { ...node.data, args, label: subroutineCallLabel(targetName, args, data.resultVar ?? '') } };
}

export function updateSubroutineCallResultVar(node: Node, resultVar: string, targetName: string): Node {
  const data = node.data as Partial<SubroutineCallNodeData>;
  return { ...node, data: { ...node.data, resultVar, label: subroutineCallLabel(targetName, data.args ?? [], resultVar) } };
}

export function declareLabel(varType: string, varName: string, varValue: string, isConst?: boolean): string {
  const prefix = isConst ? 'final ' : '';
  // Not .trim() — a value that's just a space is a real (String) value the
  // user typed on purpose, not "no value given".
  if (!varValue) return `${prefix}${varType} ${varName}`;
  return `${prefix}${varType} ${varName} = ${formatDeclaredValue(varType, varValue)}`;
}

export function entriesLabel(entries: DeclarationEntry[]): string {
  return entries.map((e) => declareLabel(e.varType, e.varName, e.varValue, e.isConst)).join('; ');
}

const DECLARE_LIST: ListBlockConfig<DeclarationEntry> = {
  blockType: 'declare',
  dataKey: 'entries',
  label: entriesLabel,
  style: DECLARE_NODE_STYLE,
};

function defaultDeclarationEntry(overrides?: {
  varType?: string;
  varName?: string;
  varValue?: string;
  isConst?: boolean;
}): DeclarationEntry {
  return {
    varType: overrides?.varType ?? 'int',
    varName: overrides?.varName ?? nextDefaultVarName(),
    // Blank, not '0' — a freshly added variable is "declare only" (see
    // generator.ts's declare case) until the user actually types a value.
    varValue: overrides?.varValue ?? '',
    isConst: overrides?.isConst ?? false,
  };
}

export function createDeclareNode(
  position: { x: number; y: number },
  overrides?: { varType?: string; varName?: string; varValue?: string; isConst?: boolean },
): Node {
  return createListNode(DECLARE_LIST, position, defaultDeclarationEntry(overrides));
}

// Appends another variable to an existing Declare block — used when a
// freshly dropped Variable block chains directly onto one (see
// FlowchartBoard's handleDrop), merging the two instead of stacking a
// second block.
export function addDeclarationEntry(
  node: Node,
  overrides?: { varType?: string; varName?: string; varValue?: string; isConst?: boolean },
): Node {
  return addListItem(DECLARE_LIST, node, defaultDeclarationEntry(overrides));
}

export function updateDeclarationEntryAt(
  node: Node,
  index: number,
  fields: { varType?: string; varName?: string; varValue?: string; isConst?: boolean },
): Node {
  const current = listOf<DeclarationEntry>(node, 'entries')[index];
  const updated: DeclarationEntry = {
    varType: fields.varType ?? current?.varType ?? 'int',
    varName: fields.varName ?? current?.varName ?? 'value',
    varValue: fields.varValue ?? current?.varValue ?? '',
    isConst: fields.isConst ?? current?.isConst ?? false,
  };
  return updateListItemAt(DECLARE_LIST, node, index, updated);
}

export function removeDeclarationEntryAt(node: Node, index: number): Node {
  return removeListItemAt(DECLARE_LIST, node, index);
}

// Reorders a Declare block's own variables via drag-and-drop (see
// DeclareNode.svelte's drag handle) — Java executes declarations in source
// order, so this changes what's visible to earlier/later lines, not just
// cosmetic ordering.
export function reorderDeclarationEntries(node: Node, fromIndex: number, toIndex: number): Node {
  return reorderListItemAt(DECLARE_LIST, node, fromIndex, toIndex);
}

export function assignmentLabel(entry: AssignmentEntry): string {
  return `${entry.varName} ${entry.operator} ${entry.value}`;
}

export function assignEntriesLabel(entries: AssignmentEntry[]): string {
  return entries.map(assignmentLabel).join('; ');
}

const ASSIGN_LIST: ListBlockConfig<AssignmentEntry> = {
  blockType: 'assign',
  dataKey: 'entries',
  label: assignEntriesLabel,
  style: ASSIGN_NODE_STYLE,
};

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

// Reorders an Assign block's own assignments via drag-and-drop (see
// AssignNode.svelte's drag handle) — Java executes assignments in source
// order, so this changes what's visible to earlier/later lines, not just
// cosmetic ordering.
export function reorderAssignmentEntries(node: Node, fromIndex: number, toIndex: number): Node {
  return reorderListItemAt(ASSIGN_LIST, node, fromIndex, toIndex);
}

export function inputLabel(entry: InputEntry): string {
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

// Reorders an Input block's own reads via drag-and-drop (see
// InputNode.svelte's drag handle) — Java executes reads in source order, so
// this changes what's visible to earlier/later lines, not just cosmetic
// ordering.
export function reorderInputEntries(node: Node, fromIndex: number, toIndex: number): Node {
  return reorderListItemAt(INPUT_LIST, node, fromIndex, toIndex);
}

// Declare's varName field, unlike its type or value, participates in a
// rename: every other block that reads that variable (Process's println
// content, Assign's target and "from var" value, Input's target — see each
// one's own dropdown, all populated from declaredVariableNamesUpstreamOf)
// references it purely by matching the name string, with no other link
// back to the Declare entry that introduced it. Renaming a Declare entry
// directly (via updateDeclarationEntryAt) would silently break every one of
// those, so this instead walks the *whole* node list — not just what's
// downstream, matching the rest of this app's simplified, edge-position-
// agnostic variable model (see graphWalk.ts's declaredVariableEntriesUpstreamOf) —
// and updates any exact-name match alongside the Declare entry itself.
//
// Free-text expressions (Decision/ForLoop/WhileLoop conditions, an Assign
// row's own custom literal) are deliberately left untouched: safely
// rewriting an identifier embedded inside an arbitrary expression needs
// real parsing, not just a string-equality check, so those are left for the
// user to fix by hand.
export function renameDeclaredVariable(nodeList: Node[], declareNodeId: string, entryIndex: number, newName: string): Node[] {
  const declareNode = nodeList.find((node) => node.id === declareNodeId);
  const oldName = (declareNode?.data as Partial<DeclareNodeData> | undefined)?.entries?.[entryIndex]?.varName;

  return nodeList.map((node) => {
    if (node.id === declareNodeId) {
      return updateDeclarationEntryAt(node, entryIndex, { varName: newName });
    }
    if (!oldName || newName === oldName) return node;

    const blockType = node.data?.blockType as BlockType | undefined;

    if (blockType === 'process') {
      const data = node.data as Partial<ProcessNodeData>;
      const oldStatements = data.statements ?? [];
      const statements = oldStatements.map((statement) => {
        const content = printlnContent(statement);
        return content === oldName ? printlnStatement(newName, isPrintlnStatement(statement)) : statement;
      });
      if (statements.every((line, i) => line === oldStatements[i])) return node;
      return { ...node, data: { ...node.data, statements, label: statementsLabel(statements) } };
    }

    if (blockType === 'assign') {
      const data = node.data as Partial<AssignNodeData>;
      const oldEntries = data.entries ?? [];
      let changed = false;
      const entries = oldEntries.map((entry) => {
        const varName = entry.varName === oldName ? newName : entry.varName;
        const value = entry.value === oldName ? newName : entry.value;
        if (varName !== entry.varName || value !== entry.value) changed = true;
        return { ...entry, varName, value };
      });
      if (!changed) return node;
      return { ...node, data: { ...node.data, entries, label: assignEntriesLabel(entries) } };
    }

    if (blockType === 'input') {
      const data = node.data as Partial<InputNodeData>;
      const oldEntries = data.entries ?? [];
      let changed = false;
      const entries = oldEntries.map((entry) => {
        if (entry.varName !== oldName) return entry;
        changed = true;
        return { ...entry, varName: newName };
      });
      if (!changed) return node;
      return { ...node, data: { ...node.data, entries, label: inputEntriesLabel(entries) } };
    }

    return node;
  });
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

// UI-only playhead, not flowchart data — same idea as stepRunner.ts's
// stepCurrentNodeId. Set by FlowchartBoard's handleDrop right after a
// Variable block lands (whether as a brand new Declare node or merged into
// an existing one), so DeclareNode.svelte can put the cursor straight into
// that freshly added entry's value field instead of making the user click
// into it themselves. Consumed (and cleared) the moment that node's own
// effect sees it, so it never re-fires on an unrelated re-render.
export const pendingFocusNodeId = writable<string | null>(null);

// The floating "what's actually being moved" ghost for a row's
// drag-to-reorder, shared by every block with a reorderable row list
// (Declare, Assign, Process, Input — see each component's own
// handleDragHandlePointerDown) — rendered by FlowchartBoard.svelte, not the
// row's own component, because a `position: fixed` element positions
// relative to the nearest transformed ancestor, and every xyflow node sits
// inside one (the pane's own pan/zoom transform) — rendered from here
// instead, a sibling of BlockPalette that isn't nested inside that
// transform, it follows the raw cursor position like BlockPalette's own
// drag ghost does.
export const rowDragGhost = writable<{ x: number; y: number; text: string } | null>(null);

// Powers the "New" button — wipes the canvas back to a single fresh Start
// block. The code panel clears itself too, since it's just a reactive
// projection of the node list (see stores/sync.ts). Also resets nodeCounter,
// so a brand new project mints the same `declare-1`/... a truly fresh page
// load would, instead of continuing on from whatever the previous project
// last reached (default variable names need no equivalent reset — see
// usedDefaultVarNames above, which always reflects live state).
export function resetFlowchart() {
  nodeCounter = 0;
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

// Every if/else on the canvas must have both its branches actually lead
// somewhere that finishes (see graphWalk.ts's allDecisionBranchesReachEnd) —
// an if with a dead-end branch would otherwise let ▶ Run silently skip half
// of what the user drew.
export const allIfBranchesReachEnd = derived([nodes, edges], ([$nodes, $edges]) => allDecisionBranchesReachEnd($nodes, $edges));

// Gates the Run/Step buttons together — a connected End block alone isn't
// enough if some if/else on the canvas has a branch that never reaches one.
export const canRunFlowchart = derived(
  [hasConnectedEndBlock, allIfBranchesReachEnd],
  ([$hasConnectedEndBlock, $allIfBranchesReachEnd]) => $hasConnectedEndBlock && $allIfBranchesReachEnd,
);

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
    // A Subroutine Start/Call/End belongs to its own separate connected
    // component (a distinct method's body — see SubroutineStartNodeData),
    // never the main flow this auto-chain targets — excluded outright so a
    // block dropped with no specific target nearby never lands on top of a
    // subroutine's own flow just because it happens to sit lower on the
    // canvas than main's own bottom node.
    if (type === 'end' || type === 'subroutineStart' || type === 'subroutineCall' || type === 'subroutineEnd') return false;
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

// How much horizontal slack a drop point gets when matching it to the
// column an existing A→B edge runs through — generous enough to forgive a
// drop that isn't pixel-perfectly centered on that column, without also
// matching some unrelated column a full block-width away.
const INSERTION_COLUMN_TOLERANCE = 60;
// The gap between A and B has to be at least this tall before a drop into it
// counts as "inserting into the gap" rather than a coincidental few-pixel
// overlap from Arrange's own ARRANGE_GAP spacing between normally-adjacent
// blocks.
const MIN_INSERTION_GAP = 40;

// The plain (non-branching) edge whose gap a freshly dropped block's
// position falls into — e.g. block A connected to block B, with B dragged
// down to leave room, and a new block C dropped in between: this finds the
// A→B edge so the caller (FlowchartBoard's handleDrop) can splice C into it
// (A→C, C→B) instead of just chaining C onto whatever's at the very bottom
// of the whole flow. Branching/loop edges (Decision's true/false, ForLoop's
// and WhileLoop's loop/exit) are excluded — their two-handles-one-edge-each
// shape, and a loop's own loop-back edge, make "splice a block into this
// gap" ambiguous, so those are left to the ordinary bottom-of-chain
// auto-connect instead.
export function findInsertionEdge(nodeList: Node[], edgeList: Edge[], dropCenter: { x: number; y: number }): Edge | null {
  const nodesById = new Map(nodeList.map((node) => [node.id, node]));
  let best: { edge: Edge; gap: number } | null = null;

  for (const edge of edgeList) {
    if (edge.sourceHandle) continue; // a branching/loop-back edge, not a plain A→B connection
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) continue;

    const sourceBottomY = source.position.y + (source.measured?.height ?? DEFAULT_BLOCK_HEIGHT);
    const targetTopY = target.position.y;
    const gap = targetTopY - sourceBottomY;
    if (gap < MIN_INSERTION_GAP) continue;
    if (dropCenter.y < sourceBottomY || dropCenter.y > targetTopY) continue;

    const sourceCenterX = source.position.x + nodeWidthFor(source) / 2;
    const targetCenterX = target.position.x + nodeWidthFor(target) / 2;
    const minX = Math.min(sourceCenterX, targetCenterX) - INSERTION_COLUMN_TOLERANCE;
    const maxX = Math.max(sourceCenterX, targetCenterX) + INSERTION_COLUMN_TOLERANCE;
    if (dropCenter.x < minX || dropCenter.x > maxX) continue;

    // Prefer the smallest gap on the rare chance the drop point matches more
    // than one candidate (e.g. overlapping columns).
    if (!best || gap < best.gap) best = { edge, gap };
  }

  return best?.edge ?? null;
}

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

      // Unlike Decision, ForLoop/WhileLoop only have one column to lay out:
      // the body stacks straight down from the diamond/hexagon, in the very
      // same column (mirroring how the True branch continues straight down
      // above) — there's no second, divergent branch needing its own
      // column, since 'exit' isn't a parallel path to reconverge with, just
      // "whatever's next" once the body's done. stopId is the loop node's
      // own id, so the body's layout walk stops the moment it reaches back
      // around the user-drawn loop-back edge, the same way generator.ts's
      // walk() stops there when emitting the `for (...) { ... }` /
      // `while (...) { ... }` block.
      if (node.data?.blockType === 'forLoop' || node.data?.blockType === 'whileLoop') {
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

  let afterFlowY = layout(startNode.id, null, originX, originY);

  // Each Subroutine Start is its own separate component's root (see
  // SubroutineStartNodeData) — never reached from Start's own walk above —
  // so it gets the same recursive layout() treatment (branches/loops inside
  // a subroutine's body still lay out correctly), stacked as its own island
  // below whatever came before it, in canvas order.
  const subroutineStarts = nodeList
    .filter((node) => node.data?.blockType === 'subroutineStart')
    .sort((a, b) => a.position.y - b.position.y);
  for (const subNode of subroutineStarts) {
    if (visited.has(subNode.id)) continue;
    afterFlowY += 90;
    afterFlowY = layout(subNode.id, null, originX, afterFlowY);
  }

  // Anything still unreached (disconnected from Start and not itself a
  // Subroutine Start — e.g. an orphaned mid-chain block) — stack below
  // everything else, in their original relative top-to-bottom order.
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
