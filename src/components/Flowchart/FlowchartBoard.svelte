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
  import ProcessNode from './ProcessNode.svelte';
  import DecisionNode from './DecisionNode.svelte';
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
    arrangeNodesVertically,
    pruneOutgoingEdge,
    pruneOutgoingEdgeForHandle,
    nodeWidthForType,
    DEFAULT_BLOCK_HEIGHT,
    type BlockType,
  } from '../../stores/flowchart';

  const nodeTypes = { declare: DeclareNode, process: ProcessNode, decision: DecisionNode };
  const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } };

  const { screenToFlowPosition } = useSvelteFlow();

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
    // target handle to connect into, so they're left standalone.
    const previousBottomId = type !== 'start' ? bottomMostNodeId($nodes) : null;
    const bottomNode = previousBottomId ? $nodes.find((node) => node.id === previousBottomId) : undefined;

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
        sourceHandle: null,
        targetHandle: null,
      };
      $edges = addEdge(
        { ...connection, markerEnd: { type: MarkerType.ArrowClosed } },
        pruneOutgoingEdge($edges, previousBottomId),
      );
    }
  }

  function handleArrange() {
    $nodes = arrangeNodesVertically($nodes);
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
    // Decision blocks branch: each of their two handles (true/false) may
    // have its own outgoing edge, so only that handle's previous edge is
    // replaced. Every other block keeps the single-outgoing-edge rule.
    const sourceNode = $nodes.find((node) => node.id === connection.source);
    const prunedEdges =
      sourceNode?.data?.blockType === 'decision'
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

  <button
    type="button"
    onclick={handleArrange}
    class="absolute right-2 top-2 z-10 rounded-md border px-3 py-1.5 text-sm shadow-sm hover:opacity-80"
    style="background: var(--color-panel); border-color: var(--color-border); color: var(--color-text);"
    title="Arrange blocks into a straight vertical line (Alt+Shift+A)"
  >
    ⇅ Arrange
  </button>
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
