<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import { nodes, updateForLoopField, PREPARATION_CLIP_PATH, type ForLoopNodeData } from '../../stores/flowchart';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as ForLoopNodeData);

  function handleInput(field: 'init' | 'condition' | 'update', event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateForLoopField(node, field, value) : node));
  }
</script>

<!-- Flowchart "Preparation"/loop-control symbol (a hexagon: flat top/bottom,
     shallow points on the left and right) — unlike Decision's diamond, it
     holds three stacked rows without clipping the outer ones against a
     taper (see stores/flowchart.ts's PREPARATION_CLIP_PATH). Handles are
     siblings of the clipped shape, not nested inside it, same reason as
     DecisionNode's. -->
<div class="relative h-full w-full">
  <Handle type="target" position={Position.Top} />

  <ShapeFrame clipPath={PREPARATION_CLIP_PATH}>
    <div class="flex h-full flex-col items-center justify-center gap-1 px-5 text-xs" style="color: var(--color-text);">
      <input
        value={nodeData.init}
        oninput={(event) => handleInput('init', event)}
        class="nodrag w-full rounded border bg-transparent px-1 py-0.5 text-center"
        style="border-color: var(--color-border);"
        placeholder="int i = 0"
        title="Init — runs once, before the loop starts"
      />
      <input
        value={nodeData.condition}
        oninput={(event) => handleInput('condition', event)}
        class="nodrag w-full rounded border bg-transparent px-1 py-0.5 text-center"
        style="border-color: var(--color-border);"
        placeholder="i < 10"
        title="Condition — checked before every iteration"
      />
      <input
        value={nodeData.update}
        oninput={(event) => handleInput('update', event)}
        class="nodrag w-full rounded border bg-transparent px-1 py-0.5 text-center"
        style="border-color: var(--color-border);"
        placeholder="i++"
        title="Update — runs after every iteration of the body"
      />
    </div>
  </ShapeFrame>

  <!-- 'loop' leads into the body — the user wires the body's last block
       back to this same node (its target handle above) to close the loop.
       'exit' is just "what comes after," not a branch to reconverge with
       (see stores/flowchart.ts's ForLoopNodeData comment). -->
  <Handle type="source" position={Position.Bottom} id="loop" />
  <span
    class="pointer-events-none absolute text-[10px]"
    style="left: 54%; bottom: -14px; color: var(--color-text-secondary);"
  >
    loop
  </span>

  <Handle type="source" position={Position.Right} id="exit" />
  <span
    class="pointer-events-none absolute text-[10px]"
    style="right: -30px; top: 46%; color: var(--color-text-secondary);"
  >
    exit
  </span>
</div>
