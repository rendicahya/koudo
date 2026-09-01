<script lang="ts">
  import {
    SvelteFlow,
    Background,
    Controls,
    useSvelteFlow,
    addEdge,
    MarkerType,
    type Connection,
    type Edge,
  } from '@xyflow/svelte';
  import BlockPalette from './BlockPalette.svelte';
  import DeclareNode from './DeclareNode.svelte';
  import AssignNode from './AssignNode.svelte';
  import InputNode from './InputNode.svelte';
  import ProcessNode from './ProcessNode.svelte';
  import DecisionNode from './DecisionNode.svelte';
  import ForLoopNode from './ForLoopNode.svelte';
  import WhileLoopNode from './WhileLoopNode.svelte';
  import SubroutineStartNode from './SubroutineStartNode.svelte';
  import SubroutineEndNode from './SubroutineEndNode.svelte';
  import SubroutineCallNode from './SubroutineCallNode.svelte';
  import CanvasContextMenu from './CanvasContextMenu.svelte';
  import { isDark } from '../../stores/theme';
  import {
    nodes,
    edges,
    createBlockNode,
    createDeclareNode,
    addDeclarationEntry,
    duplicateNodeById,
    deleteNodeById,
    deleteEdgeById,
    bottomMostNodeId,
    branchHandlesOf,
    unusedBranchHandle,
    findInsertionEdge,
    pruneOutgoingEdge,
    pruneOutgoingEdgeForHandle,
    nodeWidthForType,
    declaredVariableNamesUpstreamOf,
    DEFAULT_BLOCK_HEIGHT,
    pendingFocusNodeId,
    updateInputEntryAt,
    updateProcessStatementAt,
    printlnStatement,
    rowDragGhost,
    type BlockType,
  } from '../../stores/flowchart';
  import { stepCurrentNodeId, stepCurrentLine } from '../../stores/stepRunner';
  import { beginBatch, endBatch } from '../../stores/history';
  import { showToast } from '../../stores/toast';
  import { t } from '../../stores/i18n';
  import type { TranslationKey } from '../../lib/i18n/translations';

  // "userInput" (not "input") — xyflow's own built-in node type is called
  // "input" (used by Start blocks, see stores/flowchart.ts's
  // XYFLOW_NODE_TYPE), so this block's node.type is deliberately different
  // to avoid colliding with it.
  const nodeTypes = {
    declare: DeclareNode,
    assign: AssignNode,
    userInput: InputNode,
    process: ProcessNode,
    decision: DecisionNode,
    forLoop: ForLoopNode,
    whileLoop: WhileLoopNode,
    subroutineStart: SubroutineStartNode,
    subroutineEnd: SubroutineEndNode,
    subroutineCall: SubroutineCallNode,
  };
  const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } };

  const { screenToFlowPosition } = useSvelteFlow();

  let wrapperEl: HTMLDivElement;
  let contextMenu = $state<{ kind: 'node' | 'edge'; id: string; x: number; y: number } | null>(null);

  // BlockPalette drags a block with pointer events (see its own
  // handlePointerDown) rather than native HTML5 drag-and-drop — dataTransfer
  // and native dragstart/dragover/drop turned out not to fire reliably for
  // at least one real user, silently, with nothing to debug. Pointer events
  // route through the same mouse/touch/pen path uniformly, and this app
  // already leans on the identical pointer-capture technique for the panel
  // resizers (see App.svelte's trackDrag). onPlaceBlock is called with the
  // pointer's release position; anything the palette itself decided not to
  // start a drag for (a singleton block already on the canvas) never gets
  // here at all.
  function handlePlaceBlock(type: BlockType, clientX: number, clientY: number) {
    if (!wrapperEl) return;
    const rect = wrapperEl.getBoundingClientRect();
    // Released outside the canvas area entirely (over the navbar, the code
    // panel, ...) — the user changed their mind, not a real drop.
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
    // Released back onto the palette itself — also a cancel, not a drop
    // (see BlockPalette's own data-block-palette marker on its root).
    const targetEl = document.elementFromPoint(clientX, clientY);
    if (targetEl?.closest('[data-block-palette]')) return;

    // Wrapped in try/catch — a block failing to land used to fail completely
    // silently (any exception here would just vanish into the browser's own
    // unhandled-error log, with nothing visible in the UI at all). Surfacing
    // it as a toast turns "nothing happened" into an actual, reportable
    // error message instead.
    try {
      placeBlock(type, clientX, clientY);
    } catch (err) {
      console.error('Failed to place block on canvas:', err);
      showToast($t('toast.couldNotPlaceBlock', { error: err instanceof Error ? err.message : String(err) }));
    }
  }

  function placeBlock(type: BlockType, clientX: number, clientY: number) {
    // xyflow positions a node by its top-left corner, but a drop should
    // land where the cursor is relative to the block's center — otherwise
    // the block appears shifted down-right of where the user actually let go.
    const dropCenter = screenToFlowPosition({ x: clientX, y: clientY });

    // Dropping into the visual gap between two already-connected blocks —
    // say A → B, with B dragged down to leave room — splices the new block
    // in between them (A → C → B) instead of just chaining it onto whatever
    // sits at the very bottom of the whole flow. See findInsertionEdge for
    // the geometry this is based on.
    // A Subroutine Start is a root the same way the main flow's Start is —
    // it begins its own separate component (a distinct method's body — see
    // SubroutineStartNodeData), never a continuation of whatever's already
    // on the canvas, so it's excluded from both the mid-chain splice and the
    // auto-chain-to-bottom fallback the same way 'start' already is.
    const isRoot = type === 'start' || type === 'subroutineStart';
    const insertionEdge = !isRoot ? findInsertionEdge($nodes, $edges, dropCenter) : null;

    let previousBottomId: string | null = null;
    let sourceHandle: string | null = null;

    if (!insertionEdge) {
      // Auto-chain onto whatever's currently at the bottom of the flow, so a
      // freshly dropped block doesn't land disconnected. Start/Subroutine
      // Start blocks have no target handle to connect into, so they're left
      // standalone. Passing $edges lets a bottom-most branching block
      // (Decision or ForLoop, still short a handle) be picked as the anchor
      // too, instead of always skipping it.
      previousBottomId = !isRoot ? bottomMostNodeId($nodes, $edges) : null;
      const bottomNode = previousBottomId ? $nodes.find((node) => node.id === previousBottomId) : undefined;
      sourceHandle =
        bottomNode && branchHandlesOf(bottomNode.data?.blockType as string) ? unusedBranchHandle(bottomNode, $edges) : null;

      // Dropping a new Variable block right where it would chain onto an
      // existing Declare block merges it in as another entry instead of
      // stacking a second block — e.g. declaring `a` then `b` right below it
      // ends up as one block holding both. Output blocks don't get this
      // treatment: dropping a new print block always creates a separate one —
      // adding another print line to an existing Output block is what its own
      // "+ Add variable" control is for. Doesn't apply when inserting into a
      // mid-chain gap — that always creates a distinct block, never merges.
      if (type === 'declare' && bottomNode?.data?.blockType === 'declare') {
        $nodes = $nodes.map((node) => (node.id === bottomNode.id ? addDeclarationEntry(node) : node));
        pendingFocusNodeId.set(bottomNode.id);
        return;
      }
    }

    const position = {
      x: dropCenter.x - nodeWidthForType(type) / 2,
      y: dropCenter.y - DEFAULT_BLOCK_HEIGHT / 2,
    };
    const newNode = type === 'declare' ? createDeclareNode(position) : createBlockNode(type, position);

    $nodes = [...$nodes, newNode];
    if (type === 'declare') pendingFocusNodeId.set(newNode.id);

    if (insertionEdge) {
      const edgesWithoutInsertionPoint = $edges.filter((edge) => edge.id !== insertionEdge.id);
      $edges = addEdge(
        {
          source: insertionEdge.source,
          target: newNode.id,
          sourceHandle: insertionEdge.sourceHandle ?? null,
          targetHandle: null,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        edgesWithoutInsertionPoint,
      );
      $edges = addEdge(
        {
          source: newNode.id,
          target: insertionEdge.target,
          sourceHandle: null,
          targetHandle: insertionEdge.targetHandle ?? null,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        $edges,
      );
    } else if (previousBottomId) {
      const connection: Connection = {
        source: previousBottomId,
        target: newNode.id,
        sourceHandle,
        targetHandle: null,
      };
      $edges = addEdge(
        { ...connection, markerEnd: { type: MarkerType.ArrowClosed } },
        sourceHandle
          ? pruneOutgoingEdgeForHandle($edges, previousBottomId, sourceHandle)
          : pruneOutgoingEdge($edges, previousBottomId),
      );
    }

    // Input's and Output's dropdowns (see InputNode.svelte/ProcessNode.svelte)
    // otherwise start on the "choose" placeholder, needing a manual pick even
    // when there's only one sensible option — default straight to whichever
    // declared variable sits topmost in that same dropdown, if any exists yet.
    if (type === 'input' || type === 'process') {
      const availableVars = declaredVariableNamesUpstreamOf(newNode.id, $nodes, $edges);
      if (availableVars.length > 0) {
        const firstVar = availableVars[0];
        $nodes = $nodes.map((node) => {
          if (node.id !== newNode.id) return node;
          return type === 'input'
            ? updateInputEntryAt(node, 0, { varName: firstVar })
            : updateProcessStatementAt(node, 0, printlnStatement(firstVar));
        });
      }
    }

    // Input and Assign both target an already-declared variable (see their
    // own dropdowns in InputNode.svelte/AssignNode.svelte) — dropping one
    // before any Declare block exists upstream leaves it with nothing to
    // target, which is easy to miss since the block itself still looks fine
    // sitting on the canvas. Never fires for Input once the auto-select above
    // has already found a variable to default to.
    const NEEDS_DECLARED_VARIABLE: Partial<Record<BlockType, TranslationKey>> = {
      input: 'toast.needsDeclaredVariableInput',
      assign: 'toast.needsDeclaredVariableAssign',
    };
    const warningKey = NEEDS_DECLARED_VARIABLE[type];
    if (warningKey && declaredVariableNamesUpstreamOf(newNode.id, $nodes, $edges).length === 0) {
      showToast($t(warningKey));
    }
  }

  function handleConnect(connection: Connection) {
    // Branching blocks (Decision, ForLoop) have two handles, each of which
    // may have its own outgoing edge, so only that handle's previous edge
    // is replaced — including a ForLoop's own 'loop' handle, so wiring the
    // loop-back edge doesn't disturb 'exit' (or vice versa). Every other
    // block keeps the single-outgoing-edge rule.
    const sourceNode = $nodes.find((node) => node.id === connection.source);
    const prunedEdges = branchHandlesOf(sourceNode?.data?.blockType as string | undefined)
      ? pruneOutgoingEdgeForHandle($edges, connection.source, connection.sourceHandle)
      : pruneOutgoingEdge($edges, connection.source);

    $edges = addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, prunedEdges);
  }

  function handleNodeContextMenu({ node, event }: { node: { id: string }; event: MouseEvent }) {
    event.preventDefault();
    const rect = wrapperEl.getBoundingClientRect();
    contextMenu = { kind: 'node', id: node.id, x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleEdgeContextMenu({ edge, event }: { edge: Edge; event: MouseEvent }) {
    event.preventDefault();
    const rect = wrapperEl.getBoundingClientRect();
    contextMenu = { kind: 'edge', id: edge.id, x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function handleDuplicate() {
    if (!contextMenu || contextMenu.kind !== 'node') return;
    duplicateNodeById(contextMenu.id);
    closeContextMenu();
  }

  function handleDelete() {
    if (!contextMenu) return;
    if (contextMenu.kind === 'node') {
      deleteNodeById(contextMenu.id);
    } else {
      deleteEdgeById(contextMenu.id);
    }
    closeContextMenu();
  }

  // The step runner's "current node"/"current line" is UI-only playhead
  // state, not part of the flowchart data (see stores/stepRunner.ts) — so
  // it's applied as a plain DOM class/style here instead of fields on the
  // node object itself, which would leak into Save/Export and
  // Arrange-triggered diffs. The line label rides a CSS custom property so
  // the ::after badge (see <style> below) never needs repositioning itself
  // — it's a real pseudo-element on the node's own box, so it pans/zooms
  // with the canvas for free.
  $effect(() => {
    const activeId = $stepCurrentNodeId;
    const line = $stepCurrentLine;
    if (!wrapperEl) return;

    for (const el of wrapperEl.querySelectorAll<HTMLElement>('.svelte-flow__node.step-active')) {
      el.classList.remove('step-active', 'step-line');
      el.style.removeProperty('--step-line-label');
    }
    if (!activeId) return;

    const el = wrapperEl.querySelector<HTMLElement>(`.svelte-flow__node[data-id="${CSS.escape(activeId)}"]`);
    if (!el) return;

    el.classList.add('step-active');
    if (line) {
      el.classList.add('step-line');
      el.style.setProperty('--step-line-label', JSON.stringify(`${line.index}/${line.total} · ${line.text}`));
    }
  });
</script>

<div bind:this={wrapperEl} role="region" aria-label={$t('flowchart.canvasAriaLabel')} class="relative h-full w-full">
  <BlockPalette onPlaceBlock={handlePlaceBlock} />

  <SvelteFlow
    bind:nodes={$nodes}
    bind:edges={$edges}
    {nodeTypes}
    {defaultEdgeOptions}
    initialViewport={{ x: 0, y: 0, zoom: 1 }}
    colorMode={$isDark ? 'dark' : 'light'}
    onconnect={handleConnect}
    onnodecontextmenu={handleNodeContextMenu}
    onedgecontextmenu={handleEdgeContextMenu}
    onpaneclick={closeContextMenu}
    onnodedragstart={() => beginBatch()}
    onnodedragstop={() => endBatch()}
  >
    <Background />
    <Controls />
  </SvelteFlow>

  {#if contextMenu}
    <CanvasContextMenu
      x={contextMenu.x}
      y={contextMenu.y}
      onDuplicate={contextMenu.kind === 'node' ? handleDuplicate : undefined}
      onDelete={handleDelete}
      onClose={closeContextMenu}
    />
  {/if}

  {#if $rowDragGhost}
    <!-- Follows the cursor while a row is being dragged within a Declare,
         Assign, Process, or Input block (see each component's own
         handleDragHandlePointerDown) — rendered here, not from that
         component itself, since this is a sibling of BlockPalette outside
         SvelteFlow's own pan/zoom transform (see rowDragGhost's own comment
         for why that placement matters for `position: fixed`). -->
    <div
      class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded border px-2 py-1 font-mono text-xs whitespace-nowrap shadow-md"
      style="left: {$rowDragGhost.x}px; top: {$rowDragGhost.y}px; background: var(--color-node-bg); border-color: var(--color-accent); color: var(--color-text);"
    >
      {$rowDragGhost.text}
    </div>
  {/if}
</div>

<style>
  /* Applied via plain DOM manipulation (see the $effect above), not a
     Svelte class directive, so :global() is required — Svelte's scoping
     hash never reaches an element styled from outside its own markup. */
  :global(.svelte-flow__node.step-active) {
    outline: 3px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: 6px;
    z-index: 10;
  }

  /* Which line (of a possibly multi-line block) is about to run next — a
     real pseudo-element on the highlighted node's own box, so it moves and
     scales with the canvas on pan/zoom for free, no repositioning logic
     needed. Text comes from --step-line-label, set alongside .step-line in
     the $effect above. */
  :global(.svelte-flow__node.step-line)::after {
    content: var(--step-line-label);
    position: absolute;
    left: 0;
    bottom: 100%;
    margin-bottom: 6px;
    max-width: 260px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--color-accent);
    color: var(--color-bg);
    font-family: monospace;
    font-size: 11px;
    z-index: 20;
    pointer-events: none;
  }
</style>
