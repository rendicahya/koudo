<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import ShapeFrame from './ShapeFrame.svelte';
  import {
    nodes,
    edges,
    declaredVariableEntriesUpstreamOf,
    printlnContent,
    printlnStatement,
    isPrintlnStatement,
    addProcessStatement,
    updateProcessStatementAt,
    removeProcessStatementAt,
    reorderProcessStatements,
    rowDragGhost,
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
  let rootEl: HTMLDivElement;

  // Drag-to-reorder state (see handleDragHandlePointerDown below) — mirrors
  // DeclareNode.svelte's own drag handle, see its comments for the full
  // reasoning.
  let dragIndex: number | null = $state(null);
  let dragOverIndex: number | null = $state(null);
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
    // Switching what this row prints keeps whatever println/print choice it
    // already had (see handleNewlineToggle) — that's an independent setting,
    // not tied to which variable/value happens to be selected.
    const newline = isPrintlnStatement(statements[index]);
    // Custom value starts blank — the user types the literal next. An array
    // name always starts printing its own first element, refined via the
    // adjacent index field (see handleIndexInput).
    const statement =
      value === CUSTOM_VALUE
        ? printlnStatement('', newline)
        : arrayNames.includes(value)
          ? printlnStatement(indexedRef(value, '0'), newline)
          : value
            ? printlnStatement(value, newline)
            : '';
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, statement) : node));
  }

  function handleIndexInput(index: number, arrName: string, event: Event) {
    const indexText = (event.currentTarget as HTMLInputElement).value;
    const statement = printlnStatement(indexedRef(arrName, indexText), isPrintlnStatement(statements[index]));
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, statement) : node));
  }

  function handleValueInput(index: number, event: Event) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    // Beginner mode: the field holds a bare value (see the `inferred`
    // comment above) — quote it for real Java only now, at storage time,
    // the same split DeclareNode.svelte's own value field uses.
    const value = inferred ? formatDeclaredValue(inferDeclaredType(raw), raw) : raw;
    const statement = printlnStatement(value, isPrintlnStatement(statements[index]));
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, statement) : node));
  }

  // The "end with a new line" checkbox — println (checked, the default) vs.
  // print (unchecked). Independent of what this row prints (see handleSelect).
  function handleNewlineToggle(index: number, event: Event) {
    const newline = (event.currentTarget as HTMLInputElement).checked;
    const content = printlnContent(statements[index]) ?? '';
    const statement = printlnStatement(content, newline);
    $nodes = $nodes.map((node) => (node.id === id ? updateProcessStatementAt(node, index, statement) : node));
  }

  function handleAdd() {
    $nodes = $nodes.map((node) => (node.id === id ? addProcessStatement(node) : node));
  }

  function handleRemove(index: number) {
    $nodes = $nodes.map((node) => (node.id === id ? removeProcessStatementAt(node, index) : node));
  }

  // Which row slot a given pointer Y falls into — see DeclareNode.svelte's
  // own rowIndexAtY for the full reasoning.
  function rowIndexAtY(clientY: number): number {
    const rows = Array.from(rootEl.querySelectorAll<HTMLElement>('[data-process-row]'));
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return rows.length - 1;
  }

  function handleDragHandlePointerDown(event: PointerEvent, index: number) {
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);
    dragIndex = index;
    dragOverIndex = index;
    rowDragGhost.set({ x: event.clientX, y: event.clientY, text: statements[index] || $t('process.customValue') });

    function cleanup() {
      handle.releasePointerCapture(pointerId);
      handle.removeEventListener('pointermove', handleMove);
      handle.removeEventListener('pointerup', handleUp);
      handle.removeEventListener('pointercancel', handleCancel);
      dragIndex = null;
      dragOverIndex = null;
      rowDragGhost.set(null);
    }
    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      dragOverIndex = rowIndexAtY(moveEvent.clientY);
      rowDragGhost.update((ghost) => (ghost ? { ...ghost, x: moveEvent.clientX, y: moveEvent.clientY } : ghost));
    }
    function handleUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return;
      const from = dragIndex;
      const to = dragOverIndex;
      cleanup();
      if (from === null || to === null || from === to) return;
      $nodes = $nodes.map((node) => (node.id === id ? reorderProcessStatements(node, from, to) : node));
    }
    function handleCancel(cancelEvent: PointerEvent) {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
    }
    handle.addEventListener('pointermove', handleMove);
    handle.addEventListener('pointerup', handleUp);
    handle.addEventListener('pointercancel', handleCancel);
  }
</script>

<div bind:this={rootEl}>
  <Handle type="target" position={Position.Top} />

  <ShapeFrame clipPath={PARALLELOGRAM_CLIP_PATH}>
    <!-- Extra left padding: the parallelogram's left edge slants inward
         toward the top, so a plain symmetric px would still look cramped
         against it. -->
    <div class="flex flex-col gap-1 py-1.5 pr-4 pl-6 text-xs" style="color: var(--color-text);">
      {#each statements as statement, index (index)}
        {@const info = rowInfo(statement, scalarVariables, arrayNames)}
        {@const isCurrentRow = $stepCurrentRow?.nodeId === id && $stepCurrentRow?.rowIndex === index}
        <div
          data-process-row
          class="flex items-center gap-1"
          style:opacity={dragIndex === index ? 0.4 : 1}
          style:border-top={dragOverIndex === index && dragIndex !== null && dragIndex !== index
            ? '2px solid var(--color-accent)'
            : '2px solid transparent'}
        >
          <!-- Step Through's per-line arrow (see stores/stepRunner.ts's
               stepCurrentRow) — reserved width so other rows don't shift
               when one of them lights up. -->
          <span class="w-3 shrink-0 text-center" style="color: var(--color-accent);">{isCurrentRow ? '▶' : ''}</span>

          <!-- Drag handle — reorders this output line within the block
               (Java executes statements in source order). Pointer events,
               see handleDragHandlePointerDown above. -->
          <span
            role="button"
            tabindex="-1"
            class="nodrag shrink-0 cursor-grab touch-none px-0.5 leading-none select-none active:cursor-grabbing"
            style="color: var(--color-text-secondary);"
            title={$t('shared.dragToReorder')}
            aria-label={$t('shared.dragToReorder')}
            onpointerdown={(event) => handleDragHandlePointerDown(event, index)}
          >
            ⠿
          </span>

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

            {#if info.kind !== 'empty'}
              <!-- println (checked, the default) vs. print — whether this
                   line ends with a new line. Only shown once there's an
                   actual print call to toggle. -->
              <label class="nodrag flex shrink-0 items-center gap-0.5 select-none" style="color: var(--color-text-secondary);" title={$t('process.newlineTitle')}>
                <input type="checkbox" class="nodrag" checked={isPrintlnStatement(statement)} onchange={(event) => handleNewlineToggle(index, event)} />
                <span class="text-[10px]">⏎</span>
              </label>
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
