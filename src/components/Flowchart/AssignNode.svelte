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
  import { isArrayType, arrayBaseType, indexedRef, parseIndexedRef } from '../../lib/flowchart/arrayType';
  import { t } from '../../stores/i18n';

  const OPERATORS: AssignmentEntry['operator'][] = ['=', '+=', '-=', '*=', '/='];

  // Sentinel <option> value for "assign a literal/expression instead of
  // another variable" — distinct from any real variable name, so it can
  // share the same <select> as the variable-name options below it.
  const CUSTOM_VALUE = ' custom';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as AssignNodeData);
  let entries = $derived(nodeData.entries ?? []);
  let variableEntries = $derived(declaredVariableEntriesUpstreamOf(id, $nodes, $edges));
  // Whole-array assignment/reference isn't supported (see arrayType.ts's own
  // scope note) — an array only ever appears as its own "arr[ ]" option
  // (see the template), always targeting/reading one element via the
  // adjacent index field, never the array reference itself.
  let scalarVariables = $derived(variableEntries.filter((entry) => !isArrayType(entry.varType)).map((entry) => entry.varName));
  let arrayNames = $derived(variableEntries.filter((entry) => isArrayType(entry.varType)).map((entry) => entry.varName));

  // A row with no target picked yet (a freshly added row, or one placed
  // before anything upstream was declared) defaults to the first variable
  // in scope the moment one becomes available — picking a target is the
  // first thing this block needs anyway, so there's no reason to make the
  // user open the dropdown and choose it by hand when there's only one (or
  // an obvious first) option. Only fills in rows still at their blank
  // starting state; a target the user has since changed (including back to
  // blank, if that were possible) is never overwritten out from under them.
  let firstAutoTarget = $derived(scalarVariables[0] ?? (arrayNames[0] ? indexedRef(arrayNames[0], '0') : undefined));
  $effect(() => {
    if (firstAutoTarget === undefined) return;
    const blankIndices = entries.reduce<number[]>((acc, entry, index) => {
      if (!entry.varName) acc.push(index);
      return acc;
    }, []);
    if (blankIndices.length === 0) return;

    $nodes = $nodes.map((node) => {
      if (node.id !== id) return node;
      return blankIndices.reduce((n, index) => updateAssignmentEntryAt(n, index, { varName: firstAutoTarget }), node);
    });
  });

  // A value that names another declared variable, or indexes into a known
  // array (see arrayType.ts's parseIndexedRef), is a reference; anything
  // else — including blank, a new row's own starting state — is edited as a
  // custom literal/expression (see the type-aware editor below), same as
  // generator.ts's own reference-vs-literal check for codegen.
  function refKind(value: string, vars: string[], arrays: string[]): 'variable' | 'arrayElement' | 'custom' {
    const indexed = parseIndexedRef(value);
    if (indexed && arrays.includes(indexed.name)) return 'arrayElement';
    if (vars.includes(value)) return 'variable';
    return 'custom';
  }

  // Rows whose custom-value field currently has focus — while typing an
  // expression (e.g. "usia * 2"), the text passes through a state that
  // exactly matches a variable name ("usia") the instant that first word is
  // finished. refKind alone would flip such a row to 'variable' right
  // then, swapping the free-text input out for the reference dropdown and
  // stranding the rest of the keystroke with nowhere to land. Keeping a row
  // forced to 'custom' while it's focused defers that reclassification
  // until the user actually leaves the field.
  let editingIndices = $state(new Set<number>());

  function focusCustomValue(index: number) {
    editingIndices = new Set(editingIndices).add(index);
  }

  function blurCustomValue(index: number) {
    const next = new Set(editingIndices);
    next.delete(index);
    editingIndices = next;
  }

  // The assignment target's own declared type — a custom value has to match
  // it (see the type-aware editor below), same idea as DeclareNode's type
  // <select> driving its own value field. An indexed target resolves to its
  // *array's element* type, so e.g. a boolean array's element still gets the
  // boolean-specific editor below, not the plain literal fallback.
  function targetTypeOf(varName: string): string | undefined {
    const indexed = parseIndexedRef(varName);
    if (indexed) {
      const arrEntry = variableEntries.find((entry) => entry.varName === indexed.name && isArrayType(entry.varType));
      return arrEntry ? arrayBaseType(arrEntry.varType) : undefined;
    }
    return variableEntries.find((entry) => entry.varName === varName)?.varType;
  }

  function handleOperator(index: number, event: Event) {
    const operator = (event.currentTarget as HTMLSelectElement).value as AssignmentEntry['operator'];
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { operator }) : node));
  }

  function handleTargetSelect(index: number, event: Event) {
    const selected = (event.currentTarget as HTMLSelectElement).value;
    // Picking an array from the target dropdown always starts at its first
    // element — refined via the adjacent index field (see
    // handleTargetIndexInput).
    const newVarName = arrayNames.includes(selected) ? indexedRef(selected, '0') : selected;

    // Switching the target variable can also switch its type — a custom
    // value left over from the old type (e.g. a numeric '0' after retargeting
    // to a boolean) isn't valid for the new one, so it's cleared alongside
    // the target, same as DeclareNode's type <select>. A "from var" value
    // isn't type-specific, so it's left alone. Only an actual type change
    // triggers this: picking a target for the first time (there was no prior
    // one to have typed against) or retargeting between two variables that
    // share a type both leave an already-typed custom value — e.g.
    // "usia * 2" — alone rather than wiping out what the user just typed.
    const entry = entries[index];
    const previousType = entry?.varName ? targetTypeOf(entry.varName) : undefined;
    if (entry?.varName && previousType !== targetTypeOf(newVarName) && refKind(entry.value, scalarVariables, arrayNames) === 'custom') {
      $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { varName: newVarName, value: '' }) : node));
      return;
    }

    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { varName: newVarName }) : node));
  }

  function handleTargetIndexInput(index: number, arrName: string, event: Event) {
    const indexText = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { varName: indexedRef(arrName, indexText) }) : node));
  }

  function handleValueSelect(index: number, event: Event) {
    const selected = (event.currentTarget as HTMLSelectElement).value;
    const value = selected === CUSTOM_VALUE ? '' : arrayNames.includes(selected) ? indexedRef(selected, '0') : selected;
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { value }) : node));
  }

  function handleValueIndexInput(index: number, arrName: string, event: Event) {
    const indexText = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateAssignmentEntryAt(node, index, { value: indexedRef(arrName, indexText) }) : node));
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
    {@const kind = editingIndices.has(index) ? 'custom' : refKind(entry.value, scalarVariables, arrayNames)}
    {@const targetIndexed = parseIndexedRef(entry.varName)}
    {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
    <div class="flex flex-wrap items-center gap-1">
      <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
           stepCurrentRow) — reserved width so other rows don't shift when
           one of them lights up. -->
      <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
      <select
        value={targetIndexed && arrayNames.includes(targetIndexed.name) ? targetIndexed.name : entry.varName}
        onchange={(event) => handleTargetSelect(index, event)}
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
          oninput={(event) => handleTargetIndexInput(index, targetIndexed.name, event)}
          class="nodrag w-10 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder={$t('shared.indexPlaceholder')}
          title={$t('shared.indexTitle')}
        />
      {/if}

      <select
        value={entry.operator}
        onchange={(event) => handleOperator(index, event)}
        class="nodrag rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
      >
        {#each OPERATORS as op (op)}
          <option value={op}>{op}</option>
        {/each}
      </select>

      <select
        value={kind === 'custom' ? CUSTOM_VALUE : kind === 'arrayElement' ? parseIndexedRef(entry.value)?.name : entry.value}
        onchange={(event) => handleValueSelect(index, event)}
        class="nodrag min-w-[4.5rem] rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
      >
        {#each scalarVariables as varName (varName)}
          <option value={varName}>{varName}</option>
        {/each}
        {#each arrayNames as arrName (arrName)}
          <option value={arrName}>{arrName}[ ]</option>
        {/each}
        <option value={CUSTOM_VALUE}>{$t('assign.customValue')}</option>
      </select>

      {#if kind === 'arrayElement'}
        {@const valueIndexed = parseIndexedRef(entry.value)}
        {#if valueIndexed}
          <input
            value={valueIndexed.index}
            oninput={(event) => handleValueIndexInput(index, valueIndexed.name, event)}
            class="nodrag w-10 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder={$t('shared.indexPlaceholder')}
            title={$t('shared.indexTitle')}
          />
        {/if}
      {/if}

      {#if kind === 'custom'}
        {@const targetType = targetTypeOf(entry.varName)}
        {#if targetType === 'boolean'}
          <select
            value={entry.value}
            onchange={(event) => handleValueText(index, event)}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
          >
            <!-- Blank is this row's own starting state (see refKind) — a
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
            onfocus={() => focusCustomValue(index)}
            onblur={() => blurCustomValue(index)}
            maxlength={targetType === 'char' ? 1 : undefined}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder={$t('shared.value')}
          />
          <span class="select-none" style="color: var(--color-text-secondary);">{quote}</span>
        {:else}
          <input
            value={entry.value}
            oninput={(event) => handleValueText(index, event)}
            onfocus={() => focusCustomValue(index)}
            onblur={() => blurCustomValue(index)}
            class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
            style="border-color: var(--color-border);"
            placeholder={$t('assign.valueOrLiteral')}
          />
        {/if}
      {/if}

      {#if entries.length > 1}
        <button
          type="button"
          class="nodrag px-1 leading-none hover:opacity-70"
          style="color: var(--color-text-secondary);"
          title={$t('assign.remove')}
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
    {$t('assign.add')}
  </button>

  <Handle type="source" position={Position.Bottom} />
</div>
