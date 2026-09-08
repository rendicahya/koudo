<script lang="ts">
  import { BaseEdge, getSmoothStepPath, Position, type EdgeProps } from '@xyflow/svelte';

  // A connector that runs in straight vertical/horizontal segments and
  // only ever turns at right angles ("siku"). xyflow's own 'step' edge
  // (getSmoothStepPath with borderRadius 0) is fine for well-separated
  // nodes but, when two blocks sit close together with a slight sideways
  // offset, it throws in an extra detour — down, left, up, left, then
  // down again. This routes those cases by hand instead:
  //   - handles lined up vertically  -> one straight line
  //   - target below the source      -> a compact Z through the mid-Y
  //   - target level with / above it -> bulge out past the side and back
  // and falls back to getSmoothStepPath for any handle pairing it does
  // not special-case.

  let {
    id,
    markerStart,
    markerEnd,
    style,
    interactionWidth,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  }: EdgeProps = $props();

  const ALIGN_EPSILON = 1;
  const STUB = 14; // straight run off a handle before the first turn
  const BULGE = 48; // how far a loop-back route swings past the blocks

  function smoothStepFallback(): string {
    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 0,
    });
    return path;
  }

  function orthogonalPath(): string {
    const bottomToTop = sourcePosition === Position.Bottom && targetPosition === Position.Top;
    const sideToTop = sourcePosition === Position.Right && targetPosition === Position.Top;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    if (bottomToTop && Math.abs(dx) <= ALIGN_EPSILON) {
      return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    }

    if (bottomToTop && dy > ALIGN_EPSILON) {
      // Compact Z: down to the halfway line, across, then down into the
      // target. Never doubles back on itself however small the gap.
      const midY = sourceY + dy / 2;
      return `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
    }

    if (sideToTop && dy > ALIGN_EPSILON && dx > ALIGN_EPSILON) {
      // Out to the target's column, then straight down into its top.
      return `M ${sourceX},${sourceY} L ${targetX},${sourceY} L ${targetX},${targetY}`;
    }

    if (bottomToTop || sideToTop) {
      // Target sits level with or above the source (e.g. a loop-back
      // edge) — swing out past whichever side is further right and come
      // back up, so the line never runs back over either block.
      const exitY = sourcePosition === Position.Bottom ? sourceY + STUB : sourceY;
      const bulgeX = Math.max(sourceX, targetX) + BULGE;
      const approachY = targetY - STUB;
      return (
        `M ${sourceX},${sourceY} ` +
        `L ${sourceX},${exitY} ` +
        `L ${bulgeX},${exitY} ` +
        `L ${bulgeX},${approachY} ` +
        `L ${targetX},${approachY} ` +
        `L ${targetX},${targetY}`
      );
    }

    return smoothStepFallback();
  }

  let path = $derived(orthogonalPath());
</script>

<BaseEdge {id} {path} {markerStart} {markerEnd} {interactionWidth} {style} />
