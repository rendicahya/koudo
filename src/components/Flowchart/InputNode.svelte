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
  import { stepCurrentRow } from '../../stores/stepRunner';
  import { t } from '../../stores/i18n';

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
        {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
        <div class="flex flex-wrap items-center gap-1">
          <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
               stepCurrentRow) — reserved width so other rows don't shift
               when one of them lights up. -->
          <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
          <span style="color: var(--color-text-secondary);">{$t('input.label')}</span>
          <select
            value={entry.varName}
            onchange={(event) => handleVarSelect(index, event)}
            disabled={variables.length === 0}
            class="nodrag min-w-[4.5rem] rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
          >
            <option value="" disabled>{variables.length === 0 ? $t('shared.noVariables') : $t('shared.choose')}</option>
            {#each variables as varName (varName)}
              <option value={varName}>{varName}</option>
            {/each}
          </select>

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
