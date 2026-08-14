<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    edges,
    declaredVariableNamesUpstreamOf,
    addAssignmentEntry,
    updateAssignmentEntryAt,
    removeAssignmentEntryAt,
    type AssignNodeData,
    type AssignmentEntry,
  } from '../../stores/flowchart';

  const OPERATORS: AssignmentEntry['operator'][] = ['=', '+=', '-=', '*=', '/='];

  // Sentinel <option> value for "assign a literal/expression instead of
  // another variable" — distinct from '' (the unset placeholder) and from
  // any real variable name.
  const CUSTOM_VALUE = ' custom';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as AssignNodeData);
  let entries = $derived(nodeData.entries ?? []);
  let variables = $derived(declaredVariableNamesUpstreamOf(id, $nodes, $edges));

  function valueKind(value: string, vars: string[]): 'empty' | 'variable' | 'custom' {
    if (!value) return 'empty';
    return vars.includes(value) ? 'variable' : 'custom';
  }

  function handleField(index: number, field: 'varName' | 'operator', event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { [field]: value }) : node));
  }

  function handleValueSelect(index: number, event: Event) {
    const selected = (event.currentTarget as HTMLSelectElement).value;
    // Custom starts blank — the user types the literal/expression next.
    const value = selected === CUSTOM_VALUE ? '' : selected;
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { value }) : node));
  }

  function handleValueText(index: number, event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { value }) : node));
  }

  function handleRemove(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeAssignmentEntryAt(node, index) : node));
  }

  function handleAdd() {
    $nodes = $nodes.map((node) => (node.id === id ? addAssignmentEntry(node) : node));
  }
</script>

<!-- Standard flowchart Process symbol: a plain rectangle, no rounded
     corners (that's reserved for the Start/End terminal blocks). -->
<div
  class="flex flex-col gap-1.5 border px-2 py-1.5 text-xs"
  style="border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />

  {#each entries as entry, index (index)}
    {@const kind = valueKind(entry.value, variables)}
    <div class="flex flex-wrap items-center gap-1">
      <select
        value={entry.varName}
        onchange={(event) => handleField(index, 'varName', event)}
        disabled={variables.length === 0}
        class="nodrag min-w-[4.5rem] rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
      >
        <option value="" disabled>{variables.length === 0 ? 'no variables' : 'choose'}</option>
        {#each variables as varName (varName)}
          <option value={varName}>{varName}</option>
        {/each}
      </select>

      <select
        value={entry.operator}
        onchange={(event) => handleField(index, 'operator', event)}
        class="nodrag rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
      >
        {#each OPERATORS as op (op)}
          <option value={op}>{op}</option>
        {/each}
      </select>

      <select
        value={kind === 'custom' ? CUSTOM_VALUE : entry.value}
        onchange={(event) => handleValueSelect(index, event)}
        class="nodrag min-w-[4.5rem] rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
      >
        <option value="" disabled>{variables.length === 0 ? 'no variables' : 'from var'}</option>
        {#each variables as varName (varName)}
          <option value={varName}>{varName}</option>
        {/each}
        <option value={CUSTOM_VALUE}>✎ value</option>
      </select>

      {#if kind === 'custom'}
        <input
          value={entry.value}
          oninput={(event) => handleValueText(index, event)}
          class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder={'"text" or 5'}
        />
      {/if}

      {#if entries.length > 1}
        <button
          type="button"
          class="nodrag px-1 leading-none hover:opacity-70"
          style="color: var(--color-text-secondary);"
          title="Remove this assignment"
          onclick={() => handleRemove(index)}
        >
          ×
        </button>
      {/if}
    </div>
  {/each}

  <button
    type="button"
    class="nodrag self-start rounded px-1 py-0.5 text-left hover:opacity-70"
    style="color: var(--color-accent);"
    onclick={handleAdd}
  >
    + Add assignment
  </button>

  <Handle type="source" position={Position.Bottom} />
</div>
