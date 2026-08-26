<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    subroutineStartNodes,
    updateSubroutineCallTarget,
    updateSubroutineCallArgAt,
    type SubroutineCallNodeData,
    type SubroutineStartNodeData,
  } from '../../stores/flowchart';
  import { stepCurrentRow } from '../../stores/stepRunner';
  import { t } from '../../stores/i18n';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as SubroutineCallNodeData);
  let targetId = $derived(nodeData.targetId ?? '');
  let args = $derived(nodeData.args ?? []);
  let isCurrentRow = $derived($stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === 0);

  let subroutines = $derived(subroutineStartNodes($nodes));
  let targetNode = $derived(subroutines.find((node) => node.id === targetId));
  let targetData = $derived(targetNode?.data as Partial<SubroutineStartNodeData> | undefined);
  let targetParams = $derived(targetData?.params ?? []);

  function handleTargetSelect(event: Event) {
    const nextId = (event.currentTarget as HTMLSelectElement).value;
    const target = subroutines.find((node) => node.id === nextId);
    const targetName = (target?.data as Partial<SubroutineStartNodeData> | undefined)?.name ?? '';
    const paramCount = (target?.data as Partial<SubroutineStartNodeData> | undefined)?.params?.length ?? 0;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineCallTarget(node, nextId, targetName, paramCount) : node));
  }

  function handleArgInput(index: number, event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineCallArgAt(node, index, value, targetData?.name ?? '') : node));
  }
</script>

<!-- Flowchart "Predefined Process/Subroutine" symbol: a plain rectangle with
     an extra vertical line just inside each side edge. -->
<div
  class="relative border px-4 py-1.5 text-xs"
  style="border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />
  <div class="pointer-events-none absolute inset-y-1 left-1.5 w-px" style="background: var(--color-node-border);"></div>
  <div class="pointer-events-none absolute inset-y-1 right-1.5 w-px" style="background: var(--color-node-border);"></div>

  <div class="flex flex-wrap items-center gap-1 px-2">
    <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
    <span style="color: var(--color-text-secondary);">{$t('subroutineCall.label')}</span>
    <select
      value={targetId}
      onchange={handleTargetSelect}
      class="nodrag min-w-[5rem] rounded border bg-transparent px-1 py-0.5"
      style="border-color: var(--color-border);"
    >
      <option value="" disabled>{subroutines.length === 0 ? $t('subroutineCall.noSubroutines') : $t('shared.choose')}</option>
      {#each subroutines as sub (sub.id)}
        <option value={sub.id}>{(sub.data as Partial<SubroutineStartNodeData>).name}</option>
      {/each}
    </select>

    {#each targetParams as param, index (index)}
      <input
        value={args[index] ?? ''}
        oninput={(event) => handleArgInput(index, event)}
        class="nodrag w-14 rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
        placeholder={param.paramName}
      />
    {/each}
  </div>

  <Handle type="source" position={Position.Bottom} />
</div>
