import { get, writable } from 'svelte/store';
import type { Node } from '@xyflow/svelte';
import { nodes, edges } from './flowchart';
import { statementLinesFor, type StatementLine } from '../lib/flowchart/generator';
import { blockTypeOf, outgoing } from '../lib/flowchart/graphWalk';
import { createStepInterpreter, type StepInterpreter } from '../lib/execution/interpreter';

// The flowchart node currently "at the playhead" — highlighted on the
// canvas by FlowchartBoard (see its use of $stepCurrentNodeId). Null
// whenever no step run is active.
export const stepCurrentNodeId = writable<string | null>(null);
export const isStepping = writable<boolean>(false);
export const isStepFinished = writable<boolean>(false);
export const stepOutput = writable<string[]>([]);
export const stepError = writable<string | null>(null);
// The Variable Watcher — every variable in scope after the most recent
// step, refreshed every stepOnce() regardless of which branch ran.
export const stepVariables = writable<{ name: string; type: string; value: string }[]>([]);
// A plain-language note for states that aren't errors but still end the
// run early — e.g. stepping off a Decision branch nobody wired up.
export const stepStatus = writable<string | null>(null);
// Which specific line, inside the currently highlighted block, the *next*
// click will run — a Declare/Assign/Process/Input block can hold several
// (see currentLines below), so this is how the user tells them apart
// instead of just seeing the whole block light up. Null when the current
// block has nothing left to run (Start/End, or an empty block).
export const stepCurrentLine = writable<{ text: string; index: number; total: number } | null>(null);
// The same information, but in a shape the node components themselves can
// use — DeclareNode/AssignNode/ProcessNode/InputNode each render their
// entries/statements as one row per index, and check this to draw a ▶
// arrow next to their own current row. Null whenever the current line has
// no corresponding UI row (Decision's condition, or nothing running).
export const stepCurrentRow = writable<{ nodeId: string; rowIndex: number } | null>(null);

let interpreter: StepInterpreter | null = null;
let nodesById = new Map<string, Node>();
// Every Java statement line the currently highlighted node generates (a
// Declare/Assign/Process/Input block can hold several — one per variable,
// assignment, print, or input row) plus a cursor into it, so a multi-line
// block steps line by line instead of all at once — and each line gets its
// own click, staying on this node, before a further click moves the
// playhead on (see stepOnce): a print's output should show up while it's
// still the highlighted block, not only once the playhead has already left
// it. A Decision has no statement lines of its own — its condition is
// shown/evaluated as a single pseudo-line instead (see conditionOf),
// consumed atomically in stepOnce.
let currentLines: StatementLine[] = [];
let lineIndex = 0;

function conditionOf(node: Node): string {
  return ((node.data?.condition as string | undefined) ?? '').trim() || 'true';
}

function updateCurrentLineStore() {
  const currentId = get(stepCurrentNodeId);
  if (lineIndex >= currentLines.length) {
    stepCurrentLine.set(null);
    stepCurrentRow.set(null);
    return;
  }

  const line = currentLines[lineIndex];
  stepCurrentLine.set({ text: line.text, index: lineIndex + 1, total: currentLines.length });
  stepCurrentRow.set(currentId && line.rowIndex >= 0 ? { nodeId: currentId, rowIndex: line.rowIndex } : null);
}

// (Re)loads currentLines/lineIndex for whatever's now at the playhead.
function loadLines(nodeId: string) {
  const node = nodesById.get(nodeId);
  if (!node) {
    currentLines = [];
  } else if (blockTypeOf(node) === 'decision') {
    currentLines = [{ text: `if (${conditionOf(node)})`, rowIndex: -1 }];
  } else {
    currentLines = statementLinesFor(node, nodesById, get(edges));
  }
  lineIndex = 0;
  updateCurrentLineStore();
}

export function startStepRun() {
  const nodeList = get(nodes);
  const startNode = nodeList.find((node) => blockTypeOf(node) === 'start');
  if (!startNode) return;

  nodesById = new Map(nodeList.map((node) => [node.id, node]));
  interpreter = createStepInterpreter();
  stepOutput.set([]);
  stepError.set(null);
  stepStatus.set(null);
  stepVariables.set([]);
  isStepFinished.set(false);
  isStepping.set(true);
  stepCurrentNodeId.set(startNode.id);
  loadLines(startNode.id);
}

export function stopStepRun() {
  isStepping.set(false);
  isStepFinished.set(false);
  stepCurrentNodeId.set(null);
  stepVariables.set([]);
  currentLines = [];
  lineIndex = 0;
  stepCurrentLine.set(null);
  stepCurrentRow.set(null);
  interpreter = null;
}

// Moves the playhead to nextId, running off the end of the flow (a null
// edge, or landing on End) the same way either path finishes.
function advanceTo(nextId: string | null) {
  if (!nextId) {
    // Leave the highlight on whatever node was last reached, rather than
    // clearing it — so the user can see exactly where the trace stopped.
    stepStatus.set("Flow ends here — this path isn't connected any further.");
    isStepFinished.set(true);
    return;
  }

  stepCurrentNodeId.set(nextId);
  loadLines(nextId);
  if (blockTypeOf(nodesById.get(nextId)) === 'end') {
    stepStatus.set('Program finished.');
    isStepFinished.set(true);
  }
}

// Runs one line of whatever the currently-highlighted node does, staying on
// that node — so its effect (new output, a changed variable) is visible
// while it's still the one highlighted, not only after the playhead has
// already moved past it (see Decision's own branch below for why a
// print/declare/assign/input line always gets its own click separate from
// advancing). Only once every line has run does the *next* click move the
// playhead forward, into a Decision's chosen branch or along the single
// outgoing edge everything else has.
export function stepOnce() {
  if (!interpreter) return;
  const currentId = get(stepCurrentNodeId);
  if (!currentId || get(isStepFinished)) return;

  const node = nodesById.get(currentId);
  if (!node) return;

  try {
    if (blockTypeOf(node) === 'decision') {
      // A condition has no visible side effect of its own to see while
      // still highlighted, so evaluating it and moving into the chosen
      // branch stays a single click, unlike every other block below.
      const isTrue = interpreter.evalCondition(conditionOf(node));
      advanceTo(outgoing(get(edges), currentId, isTrue ? 'true' : 'false'));
      return;
    }

    if (lineIndex < currentLines.length) {
      interpreter.runStatements(currentLines[lineIndex].text);
      stepOutput.set(interpreter.getOutput());
      lineIndex += 1;
      updateCurrentLineStore();
      return;
    }

    advanceTo(outgoing(get(edges), currentId, null));
  } catch (err) {
    stepError.set(err instanceof Error ? err.message : String(err));
    isStepFinished.set(true);
  } finally {
    // Refreshed even on an early return (the Decision branch above) or a
    // caught error — a Declare that ran before a later statement failed
    // should still show up.
    stepVariables.set(interpreter.getVariables());
  }
}
