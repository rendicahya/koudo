<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import {
    nodes,
    edges,
    declaredVariableNamesUpstreamOf,
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

  // Sentinel <option> value for "print a literal/expression instead of a
  // variable" — distinct from '' (the unset placeholder) and from any real
  // variable name.
  const CUSTOM_VALUE = ' custom';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as ProcessNodeData);
  let statements = $derived(nodeData.statements ?? []);
  let variables = $derived(declaredVariableNamesUpstreamOf(id, $nodes, $edges));
  // Beginner mode (see stores/settings.ts): a custom value is typed bare
  // (no Java quoting) and its type inferred, same as Declare's own value
  // field — Standard mode keeps today's raw-Java-expression behavior.
  let inferred = $derived($variableMode === 'inferred');

  type RowInfo =
    | { kind: 'empty' }
    | { kind: 'variable'; varName: string }
    | { kind: 'value'; value: string }
    | { kind: 'raw'; statement: string };

  function rowInfo(statement: string, variables: string[]): RowInfo {
    if (!statement) return { kind: 'empty' };
    const content = printlnContent(statement);
    if (content === null) return { kind: 'raw', statement };
    if (variables.includes(content)) return { kind: 'variable', varName: content };
    return { kind: 'value', value: content };
  }

  function handleSelect(index: number, event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    // Custom value starts blank — the user types the literal next.
    const statement = value === CUSTOM_VALUE ? printlnStatement('') : value ? printlnStatement(value) : '';
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
        {@const info = rowInfo(statement, variables)}
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
            <span style="color: var(--color-text-secondary);">Print</span>
            <select
              value={info.kind === 'variable' ? info.varName : info.kind === 'value' ? CUSTOM_VALUE : ''}
              onchange={(event) => handleSelect(index, event)}
              class="nodrag min-w-[5rem] rounded border bg-transparent px-1 py-0.5"
              style="border-color: var(--color-border);"
            >
              <option value="" disabled>{variables.length === 0 ? 'No variables' : 'Choose'}</option>
              {#each variables as varName (varName)}
                <option value={varName}>{varName}</option>
              {/each}
              <option value={CUSTOM_VALUE}>✎ value</option>
            </select>

            {#if info.kind === 'value'}
              <input
                value={inferred ? unquoteDeclaredValue('String', info.value) : info.value}
                oninput={(event) => handleValueInput(index, event)}
                class="nodrag min-w-0 flex-1 rounded border bg-transparent px-1 py-0.5"
                style="border-color: var(--color-border);"
                placeholder={inferred ? 'text or 5' : '"text" or 5'}
              />
            {/if}
          {/if}

          {#if statements.length > 1}
            <button
              type="button"
              class="nodrag px-1 leading-none hover:opacity-70"
              style="color: var(--color-text-secondary);"
              title="Remove this line"
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
        + Add output
      </button>
    </div>
  </ShapeFrame>

  <Handle type="source" position={Position.Bottom} />
</div>
