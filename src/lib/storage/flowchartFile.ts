import type { Edge, Node } from '@xyflow/svelte';

export interface FlowchartFile {
  version: 1;
  name?: string;
  nodes: Node[];
  edges: Edge[];
}

// xyflow attaches runtime-only fields to a node once it's been
// rendered/dragged/selected (measured size, selection/drag state) — stale
// and meaningless the next time this file is opened, so they're dropped
// rather than saved.
function toSavedNode(node: Node): Node {
  const { measured, selected, dragging, ...rest } = node;
  return rest as Node;
}

export function serializeFlowchart(nodes: Node[], edges: Edge[], name: string): string {
  const payload: FlowchartFile = { version: 1, name, nodes: nodes.map(toSavedNode), edges };
  // No pretty-print indent — a .kdo file is read by this app, not a person,
  // so the smaller minified size wins over on-disk readability.
  return JSON.stringify(payload);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidNode(value: unknown): value is Node {
  if (!isPlainObject(value)) return false;
  const position = value.position;
  return (
    typeof value.id === 'string' &&
    isPlainObject(value.data) &&
    isPlainObject(position) &&
    typeof position.x === 'number' &&
    typeof position.y === 'number'
  );
}

function isValidEdge(value: unknown): value is Edge {
  return isPlainObject(value) && typeof value.id === 'string' && typeof value.source === 'string' && typeof value.target === 'string';
}

// Open Project's other half — this reads a file this same app wrote (see
// serializeFlowchart above), not arbitrary user input, so it's only
// checking for "wrong file" / "corrupted JSON" / "hand-edited into
// nonsense", not exhaustively validating every node's shape. Throws a
// message meant to be shown to the user directly (see TopNavbar.svelte's
// handleOpenFile).
export function parseFlowchartFile(raw: string): FlowchartFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Not a valid JSON file.');
  }

  if (!isPlainObject(parsed) || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("Doesn't look like a Koudo project file.");
  }
  if (!parsed.nodes.every(isValidNode) || !parsed.edges.every(isValidEdge)) {
    throw new Error('This project file looks corrupted.');
  }

  const name = typeof parsed.name === 'string' ? parsed.name : undefined;
  return { version: 1, name, nodes: parsed.nodes, edges: parsed.edges };
}
