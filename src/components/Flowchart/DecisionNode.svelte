<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import { nodes, updateDecisionCondition, DIAMOND_CLIP_PATH, type DecisionNodeData } from '../../stores/flowchart';
  import { t } from '../../stores/i18n';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as DecisionNodeData);

  function handleInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateDecisionCondition(node, value) : node));
  }
</script>

<!-- Standard flowchart Decision symbol: a diamond with two outgoing
     branches, one per outcome of the condition. Handles are siblings of
     the clipped shape (not nested inside it) — clip-path clips its whole
     subtree, and xyflow positions Handle dots straddling the shape's edge,
     which would otherwise get cut off. -->
<div class="relative h-full w-full">
  <Handle type="target" position={Position.Top} />

  <ShapeFrame clipPath={DIAMOND_CLIP_PATH}>
    <div class="flex h-full flex-col items-center justify-center gap-1 px-9 text-xs" style="color: var(--color-text);">
      <input
        value={nodeData.condition}
        oninput={handleInput}
        class="nodrag w-full rounded border bg-transparent px-1 py-0.5 text-center"
        style="border-color: var(--color-border);"
        placeholder={$t('flow.condition')}
      />
    </div>
  </ShapeFrame>

  <Handle type="source" position={Position.Bottom} id="true" />
  <span
    class="pointer-events-none absolute text-[10px]"
    style="left: 54%; bottom: -14px; color: var(--color-text-secondary);"
  >
    True
  </span>

  <Handle type="source" position={Position.Right} id="false" />
  <span
    class="pointer-events-none absolute text-[10px]"
    style="right: -36px; top: 46%; color: var(--color-text-secondary);"
  >
    False
  </span>
</div>
