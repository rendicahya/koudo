<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    addDeclarationEntry,
    updateDeclarationEntryAt,
    removeDeclarationEntryAt,
    type DeclareNodeData,
  } from '../../stores/flowchart';
  import { isValidJavaIdentifier } from '../../lib/flowchart/declarationParser';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as DeclareNodeData);
  let entries = $derived(nodeData.entries ?? []);

  function handleInput(index: number, field: 'varType' | 'varName' | 'varValue', event: Event) {
    const value = (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateDeclarationEntryAt(node, index, { [field]: value }) : node));
  }

  function handleRemove(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeDeclarationEntryAt(node, index) : node));
  }

  function handleAdd() {
    $nodes = $nodes.map((node) => (node.id === id ? addDeclarationEntry(node) : node));
  }
</script>

<!-- Standard flowchart Process symbol: a plain rectangle, no rounded
     corners (that's reserved for the Start/End terminal blocks). -->
<div
  class="flex flex-col gap-1 border px-2 py-1.5 text-xs"
  style="border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />

  {#each entries as entry, index (index)}
    {@const nameIsValid = isValidJavaIdentifier(entry.varName ?? '')}
    <div class="flex items-center gap-1">
      <select
        value={entry.varType}
        onchange={(event) => handleInput(index, 'varType', event)}
        class="nodrag rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
      >
        <option value="int">int</option>
        <option value="double">double</option>
        <option value="boolean">boolean</option>
        <option value="String">String</option>
      </select>

      <input
        value={entry.varName}
        oninput={(event) => handleInput(index, 'varName', event)}
        class="nodrag w-14 rounded border bg-transparent px-1 py-0.5"
        style="border-color: {nameIsValid ? 'var(--color-border)' : 'var(--color-error)'};"
        style:outline={nameIsValid ? 'none' : '1px solid var(--color-error)'}
        aria-invalid={!nameIsValid}
        title={nameIsValid ? undefined : `'${entry.varName}' is not a valid Java variable name`}
        placeholder="name"
      />

      <span>=</span>

      <input
        value={entry.varValue}
        oninput={(event) => handleInput(index, 'varValue', event)}
        class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
        placeholder="value"
      />

      {#if entries.length > 1}
        <button
          type="button"
          class="nodrag px-1 leading-none hover:opacity-70"
          style="color: var(--color-text-secondary);"
          title="Remove this variable"
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
    + Add variable
  </button>

  <Handle type="source" position={Position.Bottom} />
</div>
