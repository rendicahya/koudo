<script lang="ts">
  import {
    nodes,
    BLOCK_DEFINITIONS,
    PARALLELOGRAM_CLIP_PATH,
    DIAMOND_CLIP_PATH,
    PREPARATION_CLIP_PATH,
    type BlockDefinition,
  } from '../../stores/flowchart';

  let minimized = $state(false);

  let hasStart = $derived($nodes.some((node) => node.data?.blockType === 'start'));
  let hasEnd = $derived($nodes.some((node) => node.data?.blockType === 'end'));

  // Only Start/End are actually drag-blocked once one exists — comingSoon
  // blocks stay draggable-but-inert (see CLAUDE.md: they can still be
  // dropped in as a visible "(soon)" placeholder, just without working
  // parse/generate/trace logic yet).
  function isSingletonBlocked(block: BlockDefinition): boolean {
    if (!block.singleton) return false;
    if (block.type === 'start') return hasStart;
    if (block.type === 'end') return hasEnd;
    return false;
  }

  function isDimmed(block: BlockDefinition): boolean {
    return block.comingSoon || isSingletonBlocked(block);
  }

  function chipTitle(block: BlockDefinition): string {
    if (isSingletonBlocked(block)) return `${block.label} — already on the canvas`;
    if (block.comingSoon) return `${block.label} — coming soon`;
    return `Drag onto the canvas to add a ${block.label} block`;
  }

  // Input and Output share the same flowchart symbol (a parallelogram);
  // Decision is a diamond; For Loop is the hexagon "Preparation"/loop-control
  // symbol (see stores/flowchart.ts's PREPARATION_CLIP_PATH for why it isn't
  // a diamond too, despite also being a test-and-branch block).
  function clipPathFor(block: BlockDefinition): string {
    if (block.type === 'decision') return DIAMOND_CLIP_PATH;
    if (block.type === 'forLoop') return PREPARATION_CLIP_PATH;
    return PARALLELOGRAM_CLIP_PATH;
  }

  function handleDragStart(event: DragEvent, block: BlockDefinition) {
    if (isSingletonBlocked(block)) {
      event.preventDefault();
      return;
    }
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/koudo-node-type', block.type);
    event.dataTransfer.effectAllowed = 'move';
  }

  // Dropping back onto the palette itself (the user changed their mind
  // mid-drag) should cancel — not add a block. The palette sits on top of
  // the canvas, so without stopping propagation here the drop would bubble
  // to FlowchartBoard's own ondrop and create one anyway.
  function handleCancelledDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
</script>

<div
  class="absolute left-2 top-2 z-10 flex flex-col gap-1 rounded-md border p-2 text-sm shadow-sm"
  style="background: var(--color-panel); border-color: var(--color-border);"
  ondragover={handleCancelledDrop}
  ondrop={handleCancelledDrop}
>
  <div class="mb-1 flex items-center justify-between gap-3 px-1">
    <p class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">Blocks</p>
    <button
      type="button"
      class="leading-none hover:opacity-80"
      style="color: var(--color-text-secondary);"
      title={minimized ? 'Expand the block palette' : 'Minimize the block palette'}
      onclick={() => (minimized = !minimized)}
    >
      {minimized ? '▾' : '▴'}
    </button>
  </div>
  {#if !minimized}
    {#each BLOCK_DEFINITIONS as block (block.type)}
      {@const dimmed = isDimmed(block)}
      {#if block.type === 'process' || block.type === 'input' || block.type === 'decision' || block.type === 'forLoop'}
        <!-- Standard flowchart Input/Output (parallelogram) and Decision
             (diamond) symbols, matching their shape on the canvas. -->
        <div
          role="button"
          tabindex="0"
          draggable="true"
          ondragstart={(event) => handleDragStart(event, block)}
          class="cursor-grab active:cursor-grabbing"
          class:opacity-50={dimmed}
          style="background: var(--color-node-border); padding: 1px; clip-path: {clipPathFor(block)};"
          title={chipTitle(block)}
        >
          <div
            class="px-3 py-1 text-center"
            style="background: var(--color-node-bg); color: var(--color-text); clip-path: {clipPathFor(block)};"
          >
            {block.label}
          </div>
        </div>
      {:else}
        <div
          role="button"
          tabindex="0"
          draggable="true"
          ondragstart={(event) => handleDragStart(event, block)}
          class="cursor-grab px-2 py-1 text-center active:cursor-grabbing"
          class:rounded={block.type !== 'declare' && block.type !== 'assign'}
          class:opacity-50={dimmed}
          style="border: 1px solid var(--color-border); background: var(--color-node-bg); color: var(--color-text);"
          title={chipTitle(block)}
        >
          {block.label}{block.comingSoon ? ' (soon)' : ''}
        </div>
      {/if}
    {/each}
  {/if}
</div>
