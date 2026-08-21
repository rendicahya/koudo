<script lang="ts">
  import {
    nodes,
    BLOCK_DEFINITIONS,
    PARALLELOGRAM_CLIP_PATH,
    DIAMOND_CLIP_PATH,
    PREPARATION_CLIP_PATH,
    type BlockDefinition,
    type BlockType,
  } from '../../stores/flowchart';

  interface Props {
    onPlaceBlock: (type: BlockType, clientX: number, clientY: number) => void;
  }

  let { onPlaceBlock }: Props = $props();

  let minimized = $state(false);
  // The block currently being pointer-dragged, and the ghost label's
  // on-screen position — see handlePointerDown below for why this isn't
  // native HTML5 drag-and-drop.
  let drag = $state<{ type: BlockType; label: string; x: number; y: number } | null>(null);

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
    const article = /^[aeiou]/i.test(block.label) ? 'an' : 'a';
    return `Drag onto the canvas to add ${article} ${block.label} block`;
  }

  // Input and Output share the same flowchart symbol (a parallelogram);
  // Decision and While Loop are both a diamond (a while loop's single
  // condition fits the same taper Decision's does); For Loop is the hexagon
  // "Preparation"/loop-control symbol (see stores/flowchart.ts's
  // PREPARATION_CLIP_PATH for why it isn't a diamond too, despite also
  // being a test-and-branch block — its three init/condition/update fields
  // need the flat top/bottom a diamond's taper would clip).
  function clipPathFor(block: BlockDefinition): string {
    if (block.type === 'decision' || block.type === 'whileLoop') return DIAMOND_CLIP_PATH;
    if (block.type === 'forLoop') return PREPARATION_CLIP_PATH;
    return PARALLELOGRAM_CLIP_PATH;
  }

  // Pointer events (not native HTML5 drag-and-drop) — dataTransfer/
  // dragstart/dragover/drop turned out not to fire reliably for at least one
  // real user, silently and with nothing to debug. Pointer capture routes
  // mouse, touch, and pen through the same code path uniformly, same
  // technique this app already uses for the panel resizers (see App.svelte's
  // trackDrag). FlowchartBoard's onPlaceBlock decides whether the release
  // point actually counts as a drop (on the canvas, not back on this
  // palette) — this component only ever reports where the pointer ended up.
  function handlePointerDown(event: PointerEvent, block: BlockDefinition) {
    if (isSingletonBlocked(block)) return;
    event.preventDefault();

    const chip = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    chip.setPointerCapture(pointerId);
    drag = { type: block.type, label: block.label, x: event.clientX, y: event.clientY };
    document.body.style.cursor = 'grabbing';

    function cleanup() {
      chip.releasePointerCapture(pointerId);
      chip.removeEventListener('pointermove', handleMove);
      chip.removeEventListener('pointerup', handleUp);
      chip.removeEventListener('pointercancel', handleCancel);
      document.body.style.cursor = '';
      drag = null;
    }
    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      drag = { type: block.type, label: block.label, x: moveEvent.clientX, y: moveEvent.clientY };
    }
    function handleUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return;
      // Suppresses the browser's own compatibility click (and the focus
      // that can follow it) from firing on the chip once capture releases —
      // otherwise it can steal focus right back out of a newly dropped
      // Variable block's value field (see DeclareNode.svelte's own deferred
      // focus() for the other half of this).
      upEvent.preventDefault();
      cleanup();
      onPlaceBlock(block.type, upEvent.clientX, upEvent.clientY);
    }
    // The browser can steal the pointer mid-drag (e.g. a gesture, or the
    // window losing focus) — without this, that leaves the ghost label and
    // 'grabbing' cursor stuck on screen forever, since handleUp never fires.
    function handleCancel(cancelEvent: PointerEvent) {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
    }
    chip.addEventListener('pointermove', handleMove);
    chip.addEventListener('pointerup', handleUp);
    chip.addEventListener('pointercancel', handleCancel);
  }
</script>

<div
  data-block-palette
  class="absolute left-2 top-2 z-10 flex flex-col gap-2 rounded-md border p-3 text-sm shadow-sm"
  style="background: var(--color-panel); border-color: var(--color-border);"
>
  <div class="mb-1 flex items-center justify-between gap-3 px-1">
    <p class="text-sm font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">Blocks</p>
    <button
      type="button"
      class="text-lg leading-none hover:opacity-80"
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
      {#if block.type === 'process' || block.type === 'input' || block.type === 'decision' || block.type === 'forLoop' || block.type === 'whileLoop'}
        <!-- Standard flowchart Input/Output (parallelogram) and Decision
             (diamond) symbols, matching their shape on the canvas. -->
        <div
          role="button"
          tabindex="0"
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="cursor-grab touch-none active:cursor-grabbing"
          class:opacity-50={dimmed}
          style="background: var(--color-node-border); padding: 1px; clip-path: {clipPathFor(block)};"
          title={chipTitle(block)}
        >
          <div
            class="px-5 py-2 text-center"
            style="background: var(--color-node-bg); color: var(--color-text); clip-path: {clipPathFor(block)};"
          >
            {block.label}
          </div>
        </div>
      {:else if block.type === 'start' || block.type === 'end'}
        <div
          role="button"
          tabindex="0"
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="cursor-grab touch-none px-4 py-2 text-center active:cursor-grabbing"
          class:opacity-50={dimmed}
          style="border: 1px solid var(--color-border); background: var(--color-node-bg); color: var(--color-text); border-radius: 9999px;"
          title={chipTitle(block)}
        >
          {block.label}{block.comingSoon ? ' (soon)' : ''}
        </div>
      {:else}
        <div
          role="button"
          tabindex="0"
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="cursor-grab touch-none px-4 py-2 text-center active:cursor-grabbing rounded"
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

{#if drag}
  <!-- Follows the cursor during a pointer-based drag (see handlePointerDown)
       — pointer-events-none is required, not just cosmetic: FlowchartBoard's
       onPlaceBlock uses elementFromPoint(clientX, clientY) to figure out
       what's under the cursor on release, which would just find this ghost
       instead of the real canvas/palette underneath it otherwise. -->
  <div
    class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded border px-3 py-1.5 text-sm shadow-md"
    style="left: {drag.x}px; top: {drag.y}px; background: var(--color-node-bg); border-color: var(--color-accent); color: var(--color-text);"
  >
    {drag.label}
  </div>
{/if}
