import { MarkerType, type Edge } from '@xyflow/svelte';

// Every connector between blocks is drawn as an orthogonal polyline —
// straight vertical/horizontal runs that turn at sharp right angles
// ("siku") rather than xyflow's default bezier curve. 'orthogonal' is our
// custom edge (see components/Flowchart/OrthogonalEdge.svelte); it routes
// close, slightly-offset blocks cleanly where xyflow's built-in 'step'
// adds a spurious back-and-forth detour.
export const EDGE_DEFAULTS = {
  type: 'orthogonal',
  markerEnd: { type: MarkerType.ArrowClosed },
} as const;

// Saved files from before the custom edge (or hand-edited ones) may carry
// edges with no type / a stale bezier or step type — normalize them on
// load so an opened project looks the same as a freshly built one.
export function normalizeEdge(edge: Edge): Edge {
  return { ...edge, type: 'orthogonal', markerEnd: edge.markerEnd ?? { type: MarkerType.ArrowClosed } };
}
