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
  import CanvasContextMenu from './CanvasContextMenu.svelte';
  import { theme } from '../../stores/theme';
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
    arrangeNodesVertically,
    pruneOutgoingEdge,
    pruneOutgoingEdgeForHandle,
    nodeWidthForType,
    DEFAULT_BLOCK_HEIGHT,
    type BlockType,
  } from '../../stores/flowchart';
  import { stepCurrentNodeId, stepCurrentLine } from '../../stores/stepRunner';
  import { flowchartToPngDataUrl } from '../../lib/flowchart/exportPng';
  import { downloadDataUrl } from '../../lib/download';

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
  };
  const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } };

  const { screenToFlowPosition, getNodesBounds } = useSvelteFlow();

  let wrapperEl: HTMLDivElement;
  let contextMenu = $state<{ kind: 'node' | 'edge'; id: string; x: number; y: number } | null>(null);

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('application/koudo-node-type') as BlockType | '';
    if (!type) return;

    // Auto-chain onto whatever's currently at the bottom of the flow, so a
    // freshly dropped block doesn't land disconnected. Start blocks have no
    // target handle to connect into, so they're left standalone. Passing
    // $edges lets a bottom-most branching block (Decision or ForLoop, still
    // short a handle) be picked as the anchor too, instead of always
    // skipping it.
    const previousBottomId = type !== 'start' ? bottomMostNodeId($nodes, $edges) : null;
    const bottomNode = previousBottomId ? $nodes.find((node) => node.id === previousBottomId) : undefined;
    const sourceHandle =
      bottomNode && branchHandlesOf(bottomNode.data?.blockType as string) ? unusedBranchHandle(bottomNode, $edges) : null;

    // Dropping a new Variable block right where it would chain onto an
    // existing Declare block merges it in as another entry instead of
    // stacking a second block — e.g. declaring `a` then `b` right below it
    // ends up as one block holding both. Output blocks don't get this
    // treatment: dropping a new print block always creates a separate one —
    // adding another print line to an existing Output block is what its own
    // "+ Add variable" control is for.
    if (type === 'declare' && bottomNode?.data?.blockType === 'declare') {
      $nodes = $nodes.map((node) => (node.id === bottomNode.id ? addDeclarationEntry(node) : node));
      return;
    }

    // xyflow positions a node by its top-left corner, but a drop should
    // land where the cursor is relative to the block's center — otherwise
    // the block appears shifted down-right of where the user actually let go.
    const dropCenter = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const position = {
      x: dropCenter.x - nodeWidthForType(type) / 2,
      y: dropCenter.y - DEFAULT_BLOCK_HEIGHT / 2,
    };
    const newNode = type === 'declare' ? createDeclareNode(position) : createBlockNode(type, position);

    $nodes = [...$nodes, newNode];
    if (previousBottomId) {
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
  }

  function handleArrange() {
    $nodes = arrangeNodesVertically($nodes, $edges);
  }

  // The visible canvas background (--color-canvas) rather than the page/panel
  // background — a transparent PNG would otherwise show whatever's behind
  // it in a viewer instead of matching what the user actually saw on screen.
  async function handleDownloadPng() {
    const viewportEl = wrapperEl.querySelector<HTMLElement>('.svelte-flow__viewport');
    if (!viewportEl) return;

    try {
      const backgroundColor = getComputedStyle(wrapperEl).getPropertyValue('--color-canvas').trim();
      const dataUrl = await flowchartToPngDataUrl(viewportEl, $nodes, backgroundColor, getNodesBounds);
      downloadDataUrl('flowchart.png', dataUrl);
    } catch (err) {
      // html-to-image's toPng() rejects (rather than resolving to a broken
      // image) on things like a cross-origin/tainted canvas — surface it
      // instead of failing the click silently, same as Open/Save Project's
      // own error handling (see TopNavbar.svelte).
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  // Alt+Shift+A, matching the Alt+Shift+<letter> pattern already used for
  // the dark/light shortcut — avoids Ctrl combos, which Monaco and the
  // browser both claim heavily.
  function handleKeydown(event: KeyboardEvent) {
    if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      handleArrange();
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

<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={wrapperEl}
  role="region"
  aria-label="Flowchart canvas — drop blocks here"
  class="relative h-full w-full"
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <BlockPalette />

  <div class="absolute right-2 top-2 z-10 flex items-center gap-2">
    <button
      type="button"
      onclick={handleArrange}
      class="btn-panel rounded-md border px-3 py-1.5 text-sm shadow-sm hover:opacity-80"
      title="Arrange blocks into a straight vertical line (Alt+Shift+A)"
    >
      ⇅ Arrange
    </button>
    <button
      type="button"
      onclick={handleDownloadPng}
      class="btn-panel rounded-md border px-3 py-1.5 text-sm shadow-sm hover:opacity-80"
      title="Download the flowchart as a PNG image"
    >
      ⬇ PNG
    </button>
  </div>
  <SvelteFlow
    bind:nodes={$nodes}
    bind:edges={$edges}
    {nodeTypes}
    {defaultEdgeOptions}
    initialViewport={{ x: 0, y: 0, zoom: 1 }}
    colorMode={$theme}
    onconnect={handleConnect}
    onnodecontextmenu={handleNodeContextMenu}
    onedgecontextmenu={handleEdgeContextMenu}
    onpaneclick={closeContextMenu}
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
