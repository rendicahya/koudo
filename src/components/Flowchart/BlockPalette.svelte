<script lang="ts">
  import { BLOCK_DEFINITIONS, type BlockType } from '../../stores/flowchart';

  function handleDragStart(event: DragEvent, type: BlockType) {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/koudo-node-type', type);
    event.dataTransfer.effectAllowed = 'move';
  }
</script>

<div
  class="absolute left-2 top-2 z-10 flex flex-col gap-1 rounded-md border p-2 text-sm shadow-sm"
  style="background: var(--color-panel); border-color: var(--color-border);"
>
  <p class="mb-1 px-1 text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">
    Blocks
  </p>
  {#each BLOCK_DEFINITIONS as block (block.type)}
    <div
      role="button"
      tabindex="0"
      draggable="true"
      ondragstart={(event) => handleDragStart(event, block.type)}
      class="cursor-grab rounded px-2 py-1 active:cursor-grabbing"
      class:opacity-50={block.comingSoon}
      style="border: 1px solid var(--color-border); color: var(--color-text);"
      title={block.comingSoon
        ? `${block.label} — coming soon`
        : `Drag onto the canvas to add a ${block.label} block`}
    >
      + {block.label}{block.comingSoon ? ' (soon)' : ''}
    </div>
  {/each}
</div>
