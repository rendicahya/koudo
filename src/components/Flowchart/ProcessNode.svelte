<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import {
    nodes,
    edges,
    declaredVariableEntriesUpstreamOf,
    printlnContent,
    printlnStatement,
    addProcessStatement,
    updateProcessStatementAt,
    removeProcessStatementAt,
    PARALLELOGRAM_CLIP_PATH,
    type ProcessNodeData,
  } from '../../stores/flowchart';
  import { stepCurrentRow } from '../../stores/stepRunner';
  import { variableMode } from '../../stores/settings';
  import { inferDeclaredType } from '../../lib/flowchart/typeInference';
  import { formatDeclaredValue, unquoteDeclaredValue } from '../../lib/flowchart/valueFormat';
  import { isArrayType, indexedRef, parseIndexedRef } from '../../lib/flowchart/arrayType';
  import { t } from '../../stores/i18n';

  // Sentinel <option> value for "print a literal/expression instead of a
  // variable" — distinct from '' (the unset placeholder) and from any real
  // variable name.
  const CUSTOM_VALUE = ' custom';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as ProcessNodeData);
  let statements = $derived(nodeData.statements ?? []);
  let variableEntries = $derived(declaredVariableEntriesUpstreamOf(id, $nodes, $edges));
  // Whole-array printing isn't supported (see arrayType.ts's own scope note
  // — Java's real Object.toString() on an array is unhelpful garbage
  // anyway), so an array never appears in the plain-variable list; instead
  // each gets its own "arr[ ]" option (see the template) that always
  // targets one element, picked via the adjacent index field.
  let scalarVariables = $derived(variableEntries.filter((entry) => !isArrayType(entry.varType)).map((entry) => entry.varName));
  let arrayNames = $derived(variableEntries.filter((entry) => isArrayType(entry.varType)).map((entry) => entry.varName));
  // Beginner mode (see stores/settings.ts): a custom value is typed bare
  // (no Java quoting) and its type inferred, same as Declare's own value
  // field — Standard mode keeps today's raw-Java-expression behavior.
  let inferred = $derived($variableMode === 'inferred');

  type RowInfo =
    | { kind: 'empty' }
    | { kind: 'variable'; varName: string }
    | { kind: 'arrayElement'; arrName: string; index: string }
    | { kind: 'value'; value: string }
    | { kind: 'raw'; statement: string };

  function rowInfo(statement: string, variables: string[], arrays: string[]): RowInfo {
    if (!statement) return { kind: 'empty' };
    const content = printlnContent(statement);
    if (content === null) return { kind: 'raw', statement };
    const indexed = parseIndexedRef(content);
    if (indexed && arrays.includes(indexed.name)) return { kind: 'arrayElement', arrName: indexed.name, index: indexed.index };
    if (variables.includes(content)) return { kind: 'variable', varName: content };
    return { kind: 'value', value: content };
  }

  function handleSelect(index: number, event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    // Custom value starts blank — the user types the literal next. An array
    // name always starts printing its own first element, refined via the
    // adjacent index field (see handleIndexInput).
    const statement =
      value === CUSTOM_VALUE ? printlnStatement('') : arrayNames.includes(value) ? printlnStatement(indexedRef(value, '0')) : value ? printlnStatement(value) : '';
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, statement) : node));
  }

  function handleIndexInput(index: number, arrName: string, event: Event) {
    const indexText = (event.currentTarget as HTMLInputElement).value;
    const statement = printlnStatement(indexedRef(arrName, indexText));
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, statement) : node));
  }

  function handleValueInput(index: number, event: Event) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    // Beginner mode: the field holds a bare value (see the `inferred`
    // comment above) — quote it for real Java only now, at storage time,
    // the same split DeclareNode.svelte's own value field uses.
    const value = inferred ? formatDeclaredValue(inferDeclaredType(raw), raw) : raw;
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, printlnStatement(value)) : node));
  }

  function handleAdd() {
    $nodes = $nodes.map((node) => (node.id === id ? addProcessStatement(node) : node));
  }

  function handleRemove(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeProcessStatementAt(node, index) : node));
  }
</script>

<div>
  <Handle type="target" position={Position.Top} />

  <ShapeFrame clipPath={PARALLELOGRAM_CLIP_PATH}>
    <!-- Extra left padding: the parallelogram's left edge slants inward
         toward the top, so a plain symmetric px would still look cramped
         against it. -->
    <div class="flex flex-col gap-1 py-1.5 pr-4 pl-6 text-xs" style="color: var(--color-text);">
      {#each statements as statement, index (index)}
        {@const info = rowInfo(statement, scalarVariables, arrayNames)}
        {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
        <div class="flex items-center gap-1">
          <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
               stepCurrentRow) — reserved width so other rows don't shift
               when one of them lights up. -->
          <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>
          {#if info.kind === 'raw'}
            <!-- A statement typed directly in the code editor that isn't a plain
                 `println(...)` call — shown read-only, since the picker below
                 can't represent arbitrary Java. -->
            <span class="min-w-0 flex-1 truncate opacity-70" style="color: var(--color-text-secondary);" title={info.statement}>
              {info.statement}
            </span>
          {:else}
            <span style="color: var(--color-text-secondary);">{$t('process.print')}</span>
            <select
              value={info.kind === 'variable' ? info.varName : info.kind === 'arrayElement' ? info.arrName : info.kind === 'value' ? CUSTOM_VALUE : ''}
              onchange={(event) => handleSelect(index, event)}
              class="nodrag min-w-[5rem] rounded border bg-transparent px-1 py-0.5"
              style="border-color: var(--color-border);"
            >
              <option value="" disabled>{scalarVariables.length === 0 && arrayNames.length === 0 ? $t('shared.noVariables') : $t('shared.choose')}</option>
              {#each scalarVariables as varName (varName)}
                <option value={varName}>{varName}</option>
              {/each}
              {#each arrayNames as arrName (arrName)}
                <option value={arrName}>{arrName}[ ]</option>
              {/each}
              <option value={CUSTOM_VALUE}>{$t('process.customValue')}</option>
            </select>

            {#if info.kind === 'arrayElement'}
              <input
                value={info.index}
                oninput={(event) => handleIndexInput(index, info.arrName, event)}
                class="nodrag w-10 rounded border bg-transparent px-1 py-0.5"
                style="border-color: var(--color-border);"
                placeholder={$t('shared.indexPlaceholder')}
                title={$t('shared.indexTitle')}
              />
            {/if}

            {#if info.kind === 'value'}
              <input
                value={inferred ? unquoteDeclaredValue('String', info.value) : info.value}
                oninput={(event) => handleValueInput(index, event)}
                class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
                style="border-color: var(--color-border);"
                placeholder={inferred ? $t('process.valueOrLiteralInferred') : $t('process.valueOrLiteral')}
              />
            {/if}
          {/if}

          {#if statements.length > 1}
            <button
              type="button"
              class="nodrag px-1 leading-none hover:opacity-70"
              style="color: var(--color-text-secondary);"
              title={$t('process.removeLine')}
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
        {$t('process.add')}
      </button>
    </div>
  </ShapeFrame>

  <Handle type="source" position={Position.Bottom} />
</div>
