<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import {
    nodes,
    updateSubroutineName,
    updateSubroutineReturnType,
    addSubroutineParam,
    updateSubroutineParamAt,
    removeSubroutineParamAt,
    type SubroutineStartNodeData,
  } from '../../stores/flowchart';
  import { isValidJavaIdentifier } from '../../lib/flowchart/declarationParser';
  import { t } from '../../stores/i18n';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as SubroutineStartNodeData);
  let name = $derived(nodeData.name ?? '');
  let params = $derived(nodeData.params ?? []);
  let returnType = $derived(nodeData.returnType ?? 'void');
  let nameIsValid = $derived(isValidJavaIdentifier(name));

  function handleNameInput(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineName(node, value) : node));
  }

  function handleReturnTypeChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineReturnType(node, value) : node));
  }

  function handleParamType(index: number, event: Event) {
    const paramType = (event.currentTarget as HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineParamAt(node, index, { paramType }) : node));
  }

  function handleParamName(index: number, event: Event) {
    const paramName = (event.currentTarget as HTMLInputElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateSubroutineParamAt(node, index, { paramName }) : node));
  }

  function handleAddParam() {
    $nodes = $nodes.map((node) => (node.id === id ? addSubroutineParam(node) : node));
  }

  function handleRemoveParam(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeSubroutineParamAt(node, index) : node));
  }
</script>

<!-- A rounded (not sharp-cornered) rectangle — reads as "a terminal-ish,
     special block" like Start/End, but unlike their fixed pill (no room to
     grow), this one's name + parameter list needs to grow with the user's
     input. No target Handle: like the main flow's Start block, this is a
     root, never something else's flow continues into. -->
<div
  class="flex flex-col items-center gap-1 border px-3 py-1.5 text-xs"
  style="border-radius: 14px; border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <div class="flex items-center gap-1">
    <span style="color: var(--color-text-secondary);">{$t('subroutineStart.label')}</span>
    <input
      value={name}
      oninput={handleNameInput}
      class="nodrag w-20 rounded border bg-transparent px-1 py-0.5"
      style="border-color: {nameIsValid ? 'var(--color-border)' : 'var(--color-error)'};"
      aria-invalid={!nameIsValid}
      title={nameIsValid ? undefined : $t('subroutineStart.invalidName', { name })}
      placeholder={$t('subroutineStart.namePlaceholder')}
    />
  </div>

  <div class="flex items-center gap-1">
    <span style="color: var(--color-text-secondary);">{$t('subroutineStart.returnsLabel')}</span>
    <select
      value={returnType}
      onchange={handleReturnTypeChange}
      class="nodrag rounded border bg-transparent px-1 py-0.5"
      style="border-color: var(--color-border);"
    >
      <option value="void">void</option>
      <option value="int">int</option>
      <option value="long">long</option>
      <option value="double">double</option>
      <option value="float">float</option>
      <option value="boolean">boolean</option>
      <option value="char">char</option>
      <option value="String">String</option>
    </select>
  </div>

  {#if params.length > 0}
    <span class="self-start" style="color: var(--color-text-secondary);">{$t('subroutineStart.parametersLabel')}</span>
  {/if}

  {#each params as param, index (index)}
    <div class="flex items-center gap-1">
      <select
        value={param.paramType}
        onchange={(event) => handleParamType(index, event)}
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
      <input
        value={param.paramName}
        oninput={(event) => handleParamName(index, event)}
        class="nodrag w-14 rounded border bg-transparent px-1 py-0.5"
        style="border-color: var(--color-border);"
        placeholder={$t('subroutineStart.paramPlaceholder')}
      />
      <button
        type="button"
        class="nodrag px-1 leading-none hover:opacity-70"
        style="color: var(--color-text-secondary);"
        title={$t('subroutineStart.removeParam')}
        onclick={() => handleRemoveParam(index)}
      >
        ×
      </button>
    </div>
  {/each}

  <button
    type="button"
    class="nodrag rounded px-1 py-0.5 hover:opacity-70"
    style="color: var(--color-accent);"
    onclick={handleAddParam}
  >
    {$t('subroutineStart.addParam')}
  </button>

  <Handle type="source" position={Position.Bottom} />
</div>
