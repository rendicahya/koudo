<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import {
    nodes,
    edges,
    declaredVariableNamesUpstreamOf,
    addInputEntry,
    updateInputEntryAt,
    removeInputEntryAt,
    PARALLELOGRAM_CLIP_PATH,
    type InputNodeData,
  } from '../../stores/flowchart';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as InputNodeData);
  let entries = $derived(nodeData.entries ?? []);
  let variables = $derived(declaredVariableNamesUpstreamOf(id, $nodes, $edges));

  function handleVarSelect(index: number, event: Event) {
    const varName = (event.currentTarget as HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateInputEntryAt(node, index, { varName }) : node));
  }

  function handlePromptInput(index: number, event: Event) {
    const prompt = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateInputEntryAt(node, index, { prompt }) : node));
  }

  function handleAdd() {
    $nodes = $nodes.map((node) => (node.id === id ? addInputEntry(node) : node));
  }

  function handleRemove(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeInputEntryAt(node, index) : node));
  }
</script>

<div>
  <Handle type="target" position={Position.Top} />

  <ShapeFrame clipPath={PARALLELOGRAM_CLIP_PATH}>
    <!-- Extra left padding: the parallelogram's left edge slants inward
         toward the top, so a plain symmetric px would still look cramped
         against it. -->
    <div class="flex flex-col gap-1 py-1.5 pr-4 pl-6 text-xs" style="color: var(--color-text);">
      {#each entries as entry, index (index)}
        <div class="flex flex-wrap items-center gap-1">
          <span style="color: var(--color-text-secondary);">input</span>
          <select
            value={entry.varName}
            onchange={(event) => handleVarSelect(index, event)}
            disabled={variables.length === 0}
            class="nodrag min-w-[4.5rem] rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
          >
            <option value="" disabled>{variables.length === 0 ? 'no variables' : 'choose'}</option>
            {#each variables as varName (varName)}
              <option value={varName}>{varName}</option>
            {/each}
          </select>

          <input
            value={entry.prompt}
            oninput={(event) => handlePromptInput(index, event)}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder="prompt (optional)"
          />

          {#if entries.length > 1}
            <button
              type="button"
              class="nodrag px-1 leading-none hover:opacity-70"
              style="color: var(--color-text-secondary);"
              title="Remove this input"
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
        + Add input
      </button>
    </div>
  </ShapeFrame>

  <Handle type="source" position={Position.Bottom} />
</div>
