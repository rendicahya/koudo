import type { Edge, Node } from '@xyflow/svelte';

export interface FlowchartFile {
  version: 1;
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

export function serializeFlowchart(nodes: Node[], edges: Edge[]): string {
  const payload: FlowchartFile = { version: 1, nodes: nodes.map(toSavedNode), edges };
  return JSON.stringify(payload, null, 2);
}
