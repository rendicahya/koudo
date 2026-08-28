import type { Edge, Node } from '@xyflow/svelte';
import { get, writable } from 'svelte/store';
import { nodes, edges } from './flowchart';

// Undo/redo for canvas edits (add/move/delete/edit a block or connection) —
// not for settings, project name, or code panel state, which have no
// "oops, put it back" need the way the canvas does.
interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

// Generous enough to cover a long editing session without the array growing
// unbounded — undoing past this just stops working, same as most editors'
// history caps.
const MAX_HISTORY = 50;

// SvelteFlow's own bind:nodes/bind:edges (see FlowchartBoard.svelte) pushes a
// fresh nodes/edges reference on plenty of things that aren't a user edit
// worth undoing — clicking a block to select it, or xyflow's own
// ResizeObserver measuring a freshly-added node's rendered size. Comparing
// snapshots by content (with these two fields stripped) rather than by
// reference means those don't silently burn a history slot the user would
// have to Ctrl+Z through before reaching a change they actually made.
function sanitizeNode(node: Node): Omit<Node, 'measured' | 'selected'> {
  const { measured, selected, dragging, ...rest } = node;
  return rest;
}

function sanitizeEdge(edge: Edge): Omit<Edge, 'selected'> {
  const { selected, ...rest } = edge;
  return rest;
}

function keyOf(snapshot: Snapshot): string {
  return JSON.stringify({ nodes: snapshot.nodes.map(sanitizeNode), edges: snapshot.edges.map(sanitizeEdge) });
}

let past: Snapshot[] = [];
let future: Snapshot[] = [];
let last: Snapshot = { nodes: get(nodes), edges: get(edges) };
let lastKey = keyOf(last);
// Set while undo()/redo() itself is writing to nodes/edges, so that write
// doesn't get recorded as a brand new edit (which would also wipe the very
// future/past entry it just came from).
let applying = false;
// Debounces recording, both to coalesce a single user action that touches
// both nodes and edges (e.g. deleteNodeById's nodes.update followed by
// edges.update — both stores' subscribe callbacks fire synchronously within
// the same call) into one history entry instead of two, and so that typing a
// variable name character by character doesn't burn one undo step per
// keystroke — the whole burst of edits within this window becomes a single
// step, finalized once the user actually pauses.
const RECORD_DEBOUNCE_MS = 500;
let scheduleTimer: ReturnType<typeof setTimeout> | undefined;
// Set for the duration of a node drag (see beginBatch/endBatch, wired to
// SvelteFlow's onnodedragstart/onnodedragstop in FlowchartBoard.svelte) — a
// drag fires a nodes-store update on every pointer-move frame, which would
// otherwise record one undo step per frame instead of one for the whole
// drag. While suspended, per-change recording is skipped entirely; endBatch
// records the whole gesture as a single step instead.
let suspended = false;
let suspendedBaseline: Snapshot | null = null;

export const canUndo = writable(false);
export const canRedo = writable(false);

function updateFlags() {
  canUndo.set(past.length > 0);
  canRedo.set(future.length > 0);
}

function commit(baseline: Snapshot, current: Snapshot, currentKey: string) {
  past.push(baseline);
  if (past.length > MAX_HISTORY) past.shift();
  future = [];
  last = current;
  lastKey = currentKey;
  updateFlags();
}

function scheduleCheck() {
  if (applying || suspended) return;
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(() => {
    scheduleTimer = undefined;
    if (applying || suspended) return;
    const current: Snapshot = { nodes: get(nodes), edges: get(edges) };
    const currentKey = keyOf(current);
    if (currentKey === lastKey) return;
    commit(last, current, currentKey);
  }, RECORD_DEBOUNCE_MS);
}

nodes.subscribe(scheduleCheck);
edges.subscribe(scheduleCheck);

export function beginBatch() {
  if (suspended) return;
  suspended = true;
  suspendedBaseline = last;
}

export function endBatch() {
  if (!suspended) return;
  suspended = false;
  const baseline = suspendedBaseline;
  suspendedBaseline = null;
  if (!baseline) return;

  const current: Snapshot = { nodes: get(nodes), edges: get(edges) };
  const currentKey = keyOf(current);
  if (currentKey === lastKey) return;
  commit(baseline, current, currentKey);
}

export function undo() {
  if (past.length === 0) return;
  future.push({ nodes: get(nodes), edges: get(edges) });
  const previous = past.pop()!;
  applying = true;
  nodes.set(previous.nodes);
  edges.set(previous.edges);
  applying = false;
  last = previous;
  lastKey = keyOf(previous);
  updateFlags();
}

export function redo() {
  if (future.length === 0) return;
  past.push({ nodes: get(nodes), edges: get(edges) });
  const next = future.pop()!;
  applying = true;
  nodes.set(next.nodes);
  edges.set(next.edges);
  applying = false;
  last = next;
  lastKey = keyOf(next);
  updateFlags();
}

// Runs `mutate` (expected to write to nodes/edges) without recording an Undo
// step for it — for a programmatic sync that isn't itself a user edit (see
// stores/sync.ts's Start/End label sync, kept following the current
// language). Same applying-flag technique undo()/redo() use below to keep
// their own writes from re-triggering scheduleCheck.
export function applyWithoutHistory(mutate: () => void) {
  applying = true;
  mutate();
  applying = false;
  // A real edit already mid-debounce (scheduleTimer pending) has its own
  // upcoming check that will fold this correction into that same commit —
  // fast-forwarding last/lastKey here would instead erase that edit's diff
  // out from under it (comparing the corrected state to itself finds no
  // difference, so the edit never gets recorded at all). Only safe to treat
  // this write as the new resting baseline when nothing's pending.
  if (scheduleTimer) return;
  last = { nodes: get(nodes), edges: get(edges) };
  lastKey = keyOf(last);
}

// Called after New/Open Project (see ProjectMenu.svelte) — those swap in an
// entirely different flowchart, which undo should treat as a fresh starting
// point rather than something to undo back out of.
export function resetHistory() {
  past = [];
  future = [];
  last = { nodes: get(nodes), edges: get(edges) };
  lastKey = keyOf(last);
  updateFlags();
}
