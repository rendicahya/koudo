<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    edges,
    updateSubroutineEndReturnValue,
    type SubroutineEndNodeData,
    type SubroutineStartNodeData,
  } from '../../stores/flowchart';
  import { subroutineStartUpstreamOf } from '../../lib/flowchart/graphWalk';
  import { t } from '../../stores/i18n';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as SubroutineEndNodeData);
  let returnValue = $derived(nodeData.returnValue ?? '');

  // A void subroutine's End has nothing to return, so the field only shows
  // up once this End's own flow is traced back to a non-void Subroutine
  // Start (see graphWalk.ts's subroutineStartUpstreamOf) — same "not every
  // field applies" convention as e.g. Declare's beginner-mode type picker.
  let owner = $derived(subroutineStartUpstreamOf(id, $nodes, $edges));
  let ownerReturnType = $derived((owner?.data as Partial<SubroutineStartNodeData> | undefined)?.returnType ?? 'void');
  let showReturn = $derived(ownerReturnType !== 'void');

  function handleReturnInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineEndReturnValue(node, value) : node));
  }
</script>

<!-- Same role as the main flow's End block (just marks where this
     subroutine's body stops), but a distinct blockType (see
     SubroutineEndNodeData) keeps it out of End-specific checks (singleton,
     hasConnectedEndBlock). Rounded rectangle, not a fixed-width pill — an
     optional return-value field may need to grow into, and a Node's style
     is fixed at creation time (see stores/flowchart.ts's
     createSubroutineEndNode), so the room has to be there from the start. -->
<div
  class="flex flex-col items-center gap-1 border px-3 py-1.5 text-xs"
  style="border-radius: 14px; border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />
  <span>{$t('subroutineEnd.label')}</span>
  {#if showReturn}
    <div class="flex items-center gap-1">
      <span style="color: var(--color-text-secondary);">{$t('subroutineEnd.returnLabel')}</span>
      <input
        value={returnValue}
        oninput={handleReturnInput}
        class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
        placeholder={ownerReturnType}
      />
    </div>
  {/if}
</div>
