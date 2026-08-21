<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import { nodes, updateWhileLoopCondition, DIAMOND_CLIP_PATH, type WhileLoopNodeData } from '../../stores/flowchart';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as WhileLoopNodeData);

  function handleInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateWhileLoopCondition(node, value) : node));
  }
</script>

<!-- Same diamond Decision symbol, but 'loop' leads into the body (wired back
     to this same node to close the loop, a real cycle in the edge graph —
     see generator.ts's walk()) instead of a second reconverging branch, and
     'exit' is just "what comes after" — same distinction as ForLoopNode's
     hexagon, just with only a condition and no init/update. -->
<div class="relative h-full w-full">
  <Handle type="target" position={Position.Top} />

  <ShapeFrame clipPath={DIAMOND_CLIP_PATH}>
    <div class="flex h-full flex-col items-center justify-center gap-1 px-9 text-xs" style="color: var(--color-text);">
      <input
        value={nodeData.condition}
        oninput={handleInput}
        class="nodrag w-full rounded border bg-transparent px-1 py-0.5 text-center"
        style="border-color: var(--color-border);"
        placeholder="Condition"
        title="Condition — checked before every iteration"
      />
    </div>
  </ShapeFrame>

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
