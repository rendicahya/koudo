<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    addDeclarationEntry,
    updateDeclarationEntryAt,
    removeDeclarationEntryAt,
    renameDeclaredVariable,
    type DeclareNodeData,
  } from '../../stores/flowchart';
  import { isValidJavaIdentifier } from '../../lib/flowchart/declarationParser';
  import { inferDeclaredType } from '../../lib/flowchart/typeInference';
  import { variableMode } from '../../stores/settings';
  import { stepCurrentRow } from '../../stores/stepRunner';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as DeclareNodeData);
  let entries = $derived(nodeData.entries ?? []);
  // Beginner mode (see stores/settings.ts): no type <select> — the type
  // tracks the value instead (see handleInput below).
  let inferred = $derived($variableMode === 'inferred');

  function handleInput(index: number, field: 'varName' | 'varValue', event: Event) {
    const value = (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
    // A rename has to reach every other block referencing this variable by
    // name (Process/Assign/Input — see renameDeclaredVariable), not just
    // this one Declare entry.
    if (field === 'varName') {
      $nodes = renameDeclaredVariable($nodes, id, index, value);
      return;
    }
    // Beginner mode re-infers the type from the value on every keystroke —
    // a blank value keeps whatever type was last inferred rather than
    // flipping to String, so the required-value warning below is the only
    // feedback an empty field gets (see typeInference.ts's INTEGER_PATTERN
    // rejecting '' outright).
    if (field === 'varValue' && inferred) {
      const varType = value.trim() ? inferDeclaredType(value) : (entries[index]?.varType ?? 'int');
      $nodes = $nodes.map((node) =>
        node.id === id ? updateDeclarationEntryAt(node, index, { varValue: value, varType }) : node,
      );
      return;
    }
    $nodes = $nodes.map((node) => (node.id === id ? updateDeclarationEntryAt(node, index, { [field]: value }) : node));
  }

  // A leftover value from the previous type (e.g. a numeric '0' left over
  // after switching to boolean) isn't valid for the new one, so the type
  // <select> clears it alongside the type rather than leaving a stale
  // mismatch — same "blank until the user fills it in" default a brand new
  // entry starts with (see stores/flowchart.ts's defaultDeclarationEntry).
  function handleTypeChange(index: number, event: Event) {
    const varType = (event.currentTarget as HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateDeclarationEntryAt(node, index, { varType, varValue: '' }) : node));
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
    {@const valueIsMissing = inferred && !entry.varValue?.trim()}
    {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
    <div class="flex items-center gap-1">
      <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
           stepCurrentRow) — reserved width so other rows don't shift when
           one of them lights up. -->
      <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
      {#if !inferred}
        <select
          value={entry.varType}
          onchange={(event) => handleTypeChange(index, event)}
          class="nodrag rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
        >
          <option value="int">int</option>
          <option value="long">long</option>
          <option value="double">double</option>
          <option value="float">float</option>
          <option value="boolean">boolean</option>
          <option value="char">char</option>
          <option value="String">String</option>
        </select>
      {/if}

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

      {#if inferred}
        <input
          value={entry.varValue}
          oninput={(event) => handleInput(index, 'varValue', event)}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: {valueIsMissing ? 'var(--color-error)' : 'var(--color-border)'};"
          style:outline={valueIsMissing ? '1px solid var(--color-error)' : 'none'}
          aria-invalid={valueIsMissing}
          title={valueIsMissing ? 'A value is required in Beginner mode — it determines this variable’s type' : undefined}
          placeholder="value"
        />
        <!-- Beginner mode has no type <select> to show this in — the
             inferred type (see typeInference.ts) is surfaced here instead,
             read-only, so it's still visible without asking the user to
             pick it. -->
        <span
          class="shrink-0 rounded px-1 text-[10px] uppercase"
          style="color: var(--color-text-secondary); border: 1px solid var(--color-border);"
          title="Type inferred from the value"
        >
          {entry.varValue?.trim() ? entry.varType : '?'}
        </span>
      {:else if entry.varType === 'boolean'}
        <select
          value={entry.varValue}
          onchange={(event) => handleInput(index, 'varValue', event)}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
        >
          <!-- A select always has *some* option selected, so "declare only,
               no value yet" (see generator.ts's declare case) needs its own
               explicit blank option — unlike the free-text value fields
               below, which represent that same state just by being empty. -->
          <option value="">—</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      {:else if entry.varType === 'String' || entry.varType === 'char'}
        {@const quote = entry.varType === 'String' ? '"' : "'"}
        <span class="select-none" style="color: var(--color-text-secondary);">{quote}</span>
        <input
          value={entry.varValue}
          oninput={(event) => handleInput(index, 'varValue', event)}
          maxlength={entry.varType === 'char' ? 1 : undefined}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder="value"
        />
        <span class="select-none" style="color: var(--color-text-secondary);">{quote}</span>
      {:else}
        <input
          value={entry.varValue}
          oninput={(event) => handleInput(index, 'varValue', event)}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder="value"
        />
      {/if}

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
