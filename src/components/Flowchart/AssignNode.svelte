<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    edges,
    declaredVariableEntriesUpstreamOf,
    addAssignmentEntry,
    updateAssignmentEntryAt,
    removeAssignmentEntryAt,
    type AssignNodeData,
    type AssignmentEntry,
  } from '../../stores/flowchart';
  import { stepCurrentRow } from '../../stores/stepRunner';

  const OPERATORS: AssignmentEntry['operator'][] = ['=', '+=', '-=', '*=', '/='];

  // Sentinel <option> value for "assign a literal/expression instead of
  // another variable" — distinct from any real variable name, so it can
  // share the same <select> as the variable-name options below it.
  const CUSTOM_VALUE = ' custom';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as AssignNodeData);
  let entries = $derived(nodeData.entries ?? []);
  let variableEntries = $derived(declaredVariableEntriesUpstreamOf(id, $nodes, $edges));
  let variables = $derived(variableEntries.map((entry) => entry.varName));

  // A value that names another declared variable is a reference; anything
  // else — including blank, a new row's own starting state — is edited as a
  // custom literal/expression (see the type-aware editor below), same as
  // generator.ts's own reference-vs-literal check for codegen.
  function valueKind(value: string, vars: string[]): 'variable' | 'custom' {
    return vars.includes(value) ? 'variable' : 'custom';
  }

  // The assignment target's own declared type — a custom value has to match
  // it (see the type-aware editor below), same idea as DeclareNode's type
  // <select> driving its own value field.
  function targetTypeOf(varName: string): string | undefined {
    return variableEntries.find((entry) => entry.varName === varName)?.varType;
  }

  function handleField(index: number, field: 'varName' | 'operator', event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;

    // Switching the target variable can also switch its type — a custom
    // value left over from the old type (e.g. a numeric '0' after retargeting
    // to a boolean) isn't valid for the new one, so it's cleared alongside
    // the target, same as DeclareNode's type <select>. A "from var" value
    // isn't type-specific, so it's left alone.
    if (field === 'varName' && valueKind(entries[index]?.value ?? '', variables) === 'custom') {
      $nodes = $nodes.map((node) =>
        node.id === id ? updateAssignmentEntryAt(node, index, { varName: value, value: '' }) : node,
      );
      return;
    }

    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { [field]: value }) : node));
  }

  function handleValueSelect(index: number, event: Event) {
    const selected = (event.currentTarget as HTMLSelectElement).value;
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
    {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
    <div class="flex flex-wrap items-center gap-1">
      <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
           stepCurrentRow) — reserved width so other rows don't shift when
           one of them lights up. -->
      <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
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
        {#each variables as varName (varName)}
          <option value={varName}>{varName}</option>
        {/each}
        <option value={CUSTOM_VALUE}>✎ value</option>
      </select>

      {#if kind === 'custom'}
        {@const targetType = targetTypeOf(entry.varName)}
        {#if targetType === 'boolean'}
          <select
            value={entry.value}
            onchange={(event) => handleValueText(index, event)}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
          >
            <!-- Blank is this row's own starting state (see valueKind) — a
                 select always shows *some* option selected, so that state
                 needs its own explicit option, same as DeclareNode's. -->
            <option value="">—</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        {:else if targetType === 'String' || targetType === 'char'}
          {@const quote = targetType === 'String' ? '"' : "'"}
          <span class="select-none" style="color: var(--color-text-secondary);">{quote}</span>
          <input
            value={entry.value}
            oninput={(event) => handleValueText(index, event)}
            maxlength={targetType === 'char' ? 1 : undefined}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder="value"
          />
          <span class="select-none" style="color: var(--color-text-secondary);">{quote}</span>
        {:else}
          <input
            value={entry.value}
            oninput={(event) => handleValueText(index, event)}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder={'"text" or 5'}
          />
        {/if}
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
