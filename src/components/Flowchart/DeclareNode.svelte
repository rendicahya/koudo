<script lang="ts">
  import { tick } from 'svelte';
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    addDeclarationEntry,
    updateDeclarationEntryAt,
    removeDeclarationEntryAt,
    renameDeclaredVariable,
    pendingFocusNodeId,
    type DeclareNodeData,
  } from '../../stores/flowchart';
  import { isValidJavaIdentifier } from '../../lib/flowchart/declarationParser';
  import { inferDeclaredType } from '../../lib/flowchart/typeInference';
  import { variableMode } from '../../stores/settings';
  import { stepCurrentRow } from '../../stores/stepRunner';
  import { t } from '../../stores/i18n';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as DeclareNodeData);
  let entries = $derived(nodeData.entries ?? []);
  // Beginner mode (see stores/settings.ts): no type <select> — the type
  // tracks the value instead (see handleInput below).
  let inferred = $derived($variableMode === 'inferred');
  let rootEl: HTMLDivElement;

  // FlowchartBoard's placeBlock points this at whichever Declare node just
  // received a freshly added entry (new block or merged into this one) —
  // put the cursor straight into that entry's own value field, scoped by
  // [data-entry-index] since a merge can land on a node that already has
  // several rows. Cleared immediately so it only ever fires once.
  //
  // The focus() call is deferred a tick (setTimeout, not called inline) —
  // the drop itself comes from BlockPalette's pointerdown/pointerup gesture
  // (see its own handlePointerDown), which the browser follows with its own
  // synthetic focus/click handling once the pointer is released. Focusing
  // synchronously here lost that race and got overridden right back out;
  // running after the current event's synchronous work (and any compatibility
  // events queued alongside it) finishes wins it instead.
  $effect(() => {
    if ($pendingFocusNodeId !== id || !rootEl) return;
    pendingFocusNodeId.set(null);
    const lastIndex = entries.length - 1;
    const node = rootEl;
    setTimeout(() => {
      const target = node.querySelector<HTMLElement>(`[data-declare-value][data-entry-index="${lastIndex}"]`);
      target?.focus();
    }, 0);
  });

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
    // a truly blank value keeps whatever type was last inferred rather than
    // flipping to String, so the required-value warning below is the only
    // feedback an empty field gets. Checked by raw length, not .trim(): a
    // value that's just a space is a real (String) value the user typed on
    // purpose, not "nothing yet" (see typeInference.ts's own trim(), which
    // still correctly infers String for it).
    if (field === 'varValue' && inferred) {
      const varType = value.length > 0 ? inferDeclaredType(value) : (entries[index]?.varType ?? 'int');
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

  // Beginner mode's own type <select> — only reachable while the value field
  // is empty (see template below), so there's no leftover value to clear
  // like handleTypeChange above does. Restricted to the three types a
  // beginner can pick without a value to infer from — int/String/double,
  // named in plain language rather than Java's type words, matching
  // typeInference.ts's own restriction to the types a raw value can
  // unambiguously suggest.
  function handleBeginnerTypeChange(index: number, event: Event) {
    const varType = (event.currentTarget as HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateDeclarationEntryAt(node, index, { varType }) : node));
  }

  function handleRemove(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeDeclarationEntryAt(node, index) : node));
  }

  // Unlike pendingFocusNodeId's store-driven focus above (which targets the
  // *value* field, for a block just dropped from the palette), clicking
  // "+ Add variable" targets the new row's *name* field instead — there's no
  // drag gesture to race against here, so tick() (wait for the new row to
  // actually render) is enough, no setTimeout needed.
  async function handleAdd() {
    $nodes = $nodes.map((node) => (node.id === id ? addDeclarationEntry(node) : node));
    await tick();
    const lastIndex = entries.length - 1;
    rootEl.querySelector<HTMLElement>(`[data-declare-name][data-entry-index="${lastIndex}"]`)?.focus();
  }
</script>

<!-- Standard flowchart Process symbol: a plain rectangle, no rounded
     corners (that's reserved for the Start/End terminal blocks). -->
<div
  bind:this={rootEl}
  class="flex flex-col items-center gap-1 border px-3 py-1.5 text-xs"
  style="border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />

  {#each entries as entry, index (index)}
    {@const nameIsValid = isValidJavaIdentifier(entry.varName ?? '')}
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
        data-declare-name
        data-entry-index={index}
        class="nodrag w-14 rounded border bg-transparent px-1 py-0.5"
        style="border-color: {nameIsValid ? 'var(--color-border)' : 'var(--color-error)'};"
        style:outline={nameIsValid ? 'none' : '1px solid var(--color-error)'}
        aria-invalid={!nameIsValid}
        title={nameIsValid ? undefined : $t('declare.invalidName', { name: entry.varName })}
        placeholder={$t('declare.name')}
      />

      <span>=</span>

      {#if inferred}
        <input
          value={entry.varValue}
          oninput={(event) => handleInput(index, 'varValue', event)}
          data-declare-value
          data-entry-index={index}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder={$t('declare.valueOptional')}
        />
        {#if entry.varValue}
          <!-- Beginner mode has no type <select> to show this in while a
               value is present — the inferred type (see typeInference.ts)
               is surfaced here instead, read-only. -->
          <span
            class="shrink-0 rounded px-1 text-[10px] uppercase"
            style="color: var(--color-text-secondary); border: 1px solid var(--color-border);"
            title={$t('declare.inferredTitle')}
          >
            {entry.varType}
          </span>
        {:else}
          <!-- No value to infer a type from — declaring without an initial
               value is allowed, but the type still has to come from
               somewhere, so it's picked explicitly here instead. Restricted
               to the three types a beginner can name in plain language
               (matching typeInference.ts's own value-inferable set, minus
               boolean, which only shows up via an actual true/false value). -->
          <select
            value={entry.varType}
            onchange={(event) => handleBeginnerTypeChange(index, event)}
            class="nodrag rounded border bg-transparent px-1 py-0.5 text-[10px]"
            style="border-color: var(--color-border);"
            title={$t('declare.typeTitle')}
          >
            <option value="int">{$t('declare.typeWhole')}</option>
            <option value="double">{$t('declare.typeDecimal')}</option>
            <option value="String">{$t('declare.typeText')}</option>
          </select>
        {/if}
      {:else if entry.varType === 'boolean'}
        <select
          value={entry.varValue}
          onchange={(event) => handleInput(index, 'varValue', event)}
          data-declare-value
          data-entry-index={index}
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
          data-declare-value
          data-entry-index={index}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder={$t('shared.value')}
        />
        <span class="select-none" style="color: var(--color-text-secondary);">{quote}</span>
      {:else}
        <input
          value={entry.varValue}
          oninput={(event) => handleInput(index, 'varValue', event)}
          data-declare-value
          data-entry-index={index}
          class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
          style="border-color: var(--color-border);"
          placeholder={$t('shared.value')}
        />
      {/if}

      {#if entries.length > 1}
        <button
          type="button"
          class="nodrag px-1 leading-none hover:opacity-70"
          style="color: var(--color-text-secondary);"
          title={$t('declare.remove')}
          onclick={() => handleRemove(index)}
        >
          ×
        </button>
      {/if}
    </div>
  {/each}

  <button
    type="button"
    class="nodrag rounded px-1 py-0.5 hover:opacity-70"
    style="color: var(--color-accent);"
    onclick={handleAdd}
  >
    {$t('declare.add')}
  </button>

  <Handle type="source" position={Position.Bottom} />
</div>
