import { MarkerType, type Edge } from '@xyflow/svelte';

// Every connector between blocks is drawn as an orthogonal polyline —
// straight vertical/horizontal runs that turn at sharp right angles
// ("siku") rather than xyflow's default bezier curve. 'step' gives the
// hard corners; 'smoothstep' would round them.
export const EDGE_DEFAULTS = {
  type: 'step',
  markerEnd: { type: MarkerType.ArrowClosed },
} as const;

// Saved files from before the 'step' default (or hand-edited ones) may
// carry edges with no type / a stale bezier type — normalize them on load
// so an opened project looks the same as a freshly built one.
export function normalizeEdge(edge: Edge): Edge {
  return { ...edge, type: 'step', markerEnd: edge.markerEnd ?? { type: MarkerType.ArrowClosed } };
}
