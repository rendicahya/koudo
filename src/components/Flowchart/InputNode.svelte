<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import {
    nodes,
    edges,
    declaredVariableEntriesUpstreamOf,
    addInputEntry,
    updateInputEntryAt,
    removeInputEntryAt,
    PARALLELOGRAM_CLIP_PATH,
    type InputNodeData,
  } from '../../stores/flowchart';
  import { stepCurrentRow } from '../../stores/stepRunner';
  import { isArrayType, indexedRef, parseIndexedRef } from '../../lib/flowchart/arrayType';
  import { t } from '../../stores/i18n';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as InputNodeData);
  let entries = $derived(nodeData.entries ?? []);
  let variableEntries = $derived(declaredVariableEntriesUpstreamOf(id, $nodes, $edges));
  // Whole-array reads aren't supported (see arrayType.ts's own scope note)
  // — an array only ever appears as its own "arr[ ]" option (see the
  // template), always reading into one element via the adjacent index field.
  let scalarVariables = $derived(variableEntries.filter((entry) => !isArrayType(entry.varType)).map((entry) => entry.varName));
  let arrayNames = $derived(variableEntries.filter((entry) => isArrayType(entry.varType)).map((entry) => entry.varName));

  function handleVarSelect(index: number, event: Event) {
    const selected = (event.currentTarget as HTMLSelectElement).value;
    const varName = arrayNames.includes(selected) ? indexedRef(selected, '0') : selected;
    $nodes = $nodes.map((node) => (node.id === id ? updateInputEntryAt(node, index, { varName }) : node));
  }

  function handleIndexInput(index: number, arrName: string, event: Event) {
    const indexText = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateInputEntryAt(node, index, { varName: indexedRef(arrName, indexText) }) : node));
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
        {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
        {@const targetIndexed = parseIndexedRef(entry.varName)}
        <div class="flex flex-wrap items-center gap-1">
          <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
               stepCurrentRow) — reserved width so other rows don't shift
               when one of them lights up. -->
          <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
          <span style="color: var(--color-text-secondary);">{$t('input.label')}</span>
          <select
            value={targetIndexed && arrayNames.includes(targetIndexed.name) ? targetIndexed.name : entry.varName}
            onchange={(event) => handleVarSelect(index, event)}
            disabled={scalarVariables.length === 0 && arrayNames.length === 0}
            class="nodrag min-w-[4.5rem] rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
          >
            <option value="" disabled>{scalarVariables.length === 0 && arrayNames.length === 0 ? $t('shared.noVariables') : $t('shared.choose')}</option>
            {#each scalarVariables as varName (varName)}
              <option value={varName}>{varName}</option>
            {/each}
            {#each arrayNames as arrName (arrName)}
              <option value={arrName}>{arrName}[ ]</option>
            {/each}
          </select>

          {#if targetIndexed && arrayNames.includes(targetIndexed.name)}
            <input
              value={targetIndexed.index}
              oninput={(event) => handleIndexInput(index, targetIndexed.name, event)}
              class="nodrag w-10 rounded border bg-transparent px-1 py-0.5"
              style="border-color: var(--color-border);"
              placeholder={$t('shared.indexPlaceholder')}
              title={$t('shared.indexTitle')}
            />
          {/if}

          <input
            value={entry.prompt}
            oninput={(event) => handlePromptInput(index, event)}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder={$t('input.prompt')}
          />

          {#if entries.length > 1}
            <button
              type="button"
              class="nodrag px-1 leading-none hover:opacity-70"
              style="color: var(--color-text-secondary);"
              title={$t('input.remove')}
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
        {$t('input.add')}
      </button>
    </div>
  </ShapeFrame>

  <Handle type="source" position={Position.Bottom} />
</div>
