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
  import { variableMode } from '../../stores/settings';
  import { t } from '../../stores/i18n';
  import type { TranslationKey } from '../../lib/i18n/translations';

  interface Props {
    onPlaceBlock: (type: BlockType, clientX: number, clientY: number) => void;
  }

  let { onPlaceBlock }: Props = $props();

  let minimized = $state(false);
  // The block currently being pointer-dragged, and the ghost label's
  // on-screen position — see handlePointerDown below for why this isn't
  // native HTML5 drag-and-drop.
  let drag = $state<{ type: BlockType; label: string; x: number; y: number } | null>(null);

  // Methods/subroutines are a more advanced concept than this app otherwise
  // teaches in Beginner Mode (see stores/settings.ts's variableMode) — and,
  // unlike Declare's own value-based type inference, a parameter has no
  // sample value to infer a type from, so there's no beginner-friendly
  // version of the type pickers their signature genuinely needs. Hidden
  // from the palette entirely in Beginner Mode rather than shown with those
  // pickers; any Subroutine blocks already on the canvas from a prior
  // Standard Mode session are untouched and keep working.
  let visibleBlocks = $derived(
    $variableMode === 'inferred'
      ? BLOCK_DEFINITIONS.filter(
          (block) => block.type !== 'subroutineStart' && block.type !== 'subroutineCall' && block.type !== 'subroutineEnd',
        )
      : BLOCK_DEFINITIONS,
  );

  let hasStart = $derived($nodes.some((node) => node.data?.blockType === 'start'));
  let hasEnd = $derived($nodes.some((node) => node.data?.blockType === 'end'));

  // Every block's own display name. Start/End are xyflow's built-in node
  // types with a label baked into node data at creation time rather than
  // read reactively (see translations.ts's file header comment) — the chip
  // here still translates fine (this component itself re-renders on a
  // language switch like any other), it's only the already-placed canvas
  // node that needs stores/sync.ts's syncStartEndLabels to catch up.
  const BLOCK_TYPE_LABEL_KEY: Partial<Record<BlockType, TranslationKey>> = {
    start: 'block.type.start',
    end: 'block.type.end',
    declare: 'block.type.declare',
    assign: 'block.type.assign',
    input: 'block.type.input',
    process: 'block.type.process',
    decision: 'block.type.decision',
    forLoop: 'block.type.forLoop',
    whileLoop: 'block.type.whileLoop',
    subroutineStart: 'block.type.subroutineStart',
    subroutineCall: 'block.type.subroutineCall',
    subroutineEnd: 'block.type.subroutineEnd',
  };

  function displayLabel(block: BlockDefinition): string {
    const key = BLOCK_TYPE_LABEL_KEY[block.type];
    return key ? $t(key) : block.label;
  }

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
    const label = displayLabel(block);
    if (isSingletonBlocked(block)) return $t('palette.chipAlreadyOnCanvas', { label });
    if (block.comingSoon) return $t('palette.chipComingSoon', { label });
    // Indonesian's template has no {article} token, so this is silently
    // unused there — English is the only language needing a/an agreement.
    const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
    return $t('palette.chipDragHint', { article, label });
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
    drag = { type: block.type, label: displayLabel(block), x: event.clientX, y: event.clientY };
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
      drag = { type: block.type, label: displayLabel(block), x: moveEvent.clientX, y: moveEvent.clientY };
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
  class="absolute left-2 top-2 z-10 flex max-h-[calc(100%-1rem)] flex-col gap-2 overflow-y-auto rounded-md border p-3 text-sm shadow-sm"
  style="background: var(--color-panel); border-color: var(--color-border);"
>
  <div class="mb-1 flex items-center justify-between gap-3 px-1">
    <p class="text-sm font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">{$t('palette.heading')}</p>
    <button
      type="button"
      class="text-lg leading-none hover:opacity-80"
      style="color: var(--color-text-secondary);"
      title={minimized ? $t('palette.expand') : $t('palette.minimize')}
      onclick={() => (minimized = !minimized)}
    >
      {minimized ? '▾' : '▴'}
    </button>
  </div>
  {#if !minimized}
    {#each visibleBlocks as block (block.type)}
      {@const dimmed = isDimmed(block)}
      {#if block.type === 'process' || block.type === 'input' || block.type === 'decision' || block.type === 'forLoop' || block.type === 'whileLoop'}
        <!-- Standard flowchart Input/Output (parallelogram) and Decision
             (diamond) symbols, matching their shape on the canvas. -->
        <div
          role="button"
          tabindex="0"
          data-block-chip={block.type}
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
            {displayLabel(block)}
          </div>
        </div>
      {:else if block.type === 'start' || block.type === 'end'}
        <div
          role="button"
          tabindex="0"
          data-block-chip={block.type}
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="cursor-grab touch-none px-4 py-2 text-center active:cursor-grabbing"
          class:opacity-50={dimmed}
          style="border: 1px solid var(--color-border); background: var(--color-node-bg); color: var(--color-text); border-radius: 9999px;"
          title={chipTitle(block)}
        >
          {displayLabel(block)}{block.comingSoon ? $t('palette.comingSoonSuffix') : ''}
        </div>
      {:else if block.type === 'subroutineStart' || block.type === 'subroutineEnd'}
        <!-- Same rounded-terminal family as Start/End, but with a translated
             label (see BLOCK_TYPE_LABEL_KEY) — unlike Start/End, these are
             this app's own custom components, not xyflow's fixed built-ins. -->
        <div
          role="button"
          tabindex="0"
          data-block-chip={block.type}
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="cursor-grab touch-none px-4 py-2 text-center active:cursor-grabbing"
          class:opacity-50={dimmed}
          style="border: 1px solid var(--color-border); background: var(--color-node-bg); color: var(--color-text); border-radius: 14px;"
          title={chipTitle(block)}
        >
          {displayLabel(block)}{block.comingSoon ? $t('palette.comingSoonSuffix') : ''}
        </div>
      {:else if block.type === 'subroutineCall'}
        <!-- Flowchart "Predefined Process/Subroutine" symbol: a rectangle
             with an extra vertical line just inside each side edge. -->
        <div
          role="button"
          tabindex="0"
          data-block-chip={block.type}
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="relative cursor-grab touch-none px-4 py-2 text-center active:cursor-grabbing"
          class:opacity-50={dimmed}
          style="border: 1px solid var(--color-border); background: var(--color-node-bg); color: var(--color-text);"
          title={chipTitle(block)}
        >
          <div class="pointer-events-none absolute inset-y-1 left-1.5 w-px" style="background: var(--color-border);"></div>
          <div class="pointer-events-none absolute inset-y-1 right-1.5 w-px" style="background: var(--color-border);"></div>
          {displayLabel(block)}{block.comingSoon ? $t('palette.comingSoonSuffix') : ''}
        </div>
      {:else}
        <div
          role="button"
          tabindex="0"
          data-block-chip={block.type}
          onpointerdown={(event) => handlePointerDown(event, block)}
          class="cursor-grab touch-none px-4 py-2 text-center active:cursor-grabbing rounded"
          class:opacity-50={dimmed}
          style="border: 1px solid var(--color-border); background: var(--color-node-bg); color: var(--color-text);"
          title={chipTitle(block)}
        >
          {displayLabel(block)}{block.comingSoon ? $t('palette.comingSoonSuffix') : ''}
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
