<script lang="ts">
  import { SvelteFlow, Background, Controls, useSvelteFlow, addEdge, MarkerType, type Connection } from '@xyflow/svelte';
  import BlockPalette from './BlockPalette.svelte';
  import DeclareNode from './DeclareNode.svelte';
  import NodeContextMenu from './NodeContextMenu.svelte';
  import {
    nodes,
    edges,
    createBlockNode,
    createDeclareNode,
    duplicateNodeById,
    deleteNodeById,
    type BlockType,
  } from '../../stores/flowchart';

  const nodeTypes = { declare: DeclareNode };
  const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } };

  const { screenToFlowPosition } = useSvelteFlow();

  let wrapperEl: HTMLDivElement;
  let contextMenu = $state<{ nodeId: string; x: number; y: number } | null>(null);

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('application/koudo-node-type') as BlockType | '';
    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode = type === 'declare' ? createDeclareNode(position) : createBlockNode(type, position);
    $nodes = [...$nodes, newNode];
  }

  function handleConnect(connection: Connection) {
    $edges = addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, $edges);
  }

  function handleNodeContextMenu({ node, event }: { node: { id: string }; event: MouseEvent }) {
    event.preventDefault();
    const rect = wrapperEl.getBoundingClientRect();
    contextMenu = { nodeId: node.id, x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  function handleDuplicate() {
    if (!contextMenu) return;
    duplicateNodeById(contextMenu.nodeId);
    closeContextMenu();
  }

  function handleDelete() {
    if (!contextMenu) return;
    deleteNodeById(contextMenu.nodeId);
    closeContextMenu();
  }
</script>

<div
  bind:this={wrapperEl}
  role="region"
  aria-label="Flowchart canvas — drop blocks here"
  class="relative h-full w-full"
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <BlockPalette />
  <SvelteFlow
    bind:nodes={$nodes}
    bind:edges={$edges}
    {nodeTypes}
    {defaultEdgeOptions}
    fitView
    colorMode="system"
    onconnect={handleConnect}
    onnodecontextmenu={handleNodeContextMenu}
    onpaneclick={closeContextMenu}
  >
    <Background />
    <Controls />
  </SvelteFlow>

  {#if contextMenu}
    <NodeContextMenu
      x={contextMenu.x}
      y={contextMenu.y}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onClose={closeContextMenu}
    />
  {/if}
</div>
