<script lang="ts">
  let {
    x,
    y,
    onDuplicate,
    onDelete,
    onClose,
  }: {
    x: number;
    y: number;
    onDuplicate: () => void;
    onDelete: () => void;
    onClose: () => void;
  } = $props();

  let menuEl: HTMLDivElement;

  function handleWindowClick(event: MouseEvent) {
    if (menuEl && !menuEl.contains(event.target as globalThis.Node)) onClose();
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div
  bind:this={menuEl}
  role="menu"
  class="absolute z-20 flex flex-col overflow-hidden rounded-md border text-sm shadow-md"
  style="left: {x}px; top: {y}px; border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
>
  <button type="button" role="menuitem" class="px-3 py-1.5 text-left hover:opacity-80" onclick={onDuplicate}>
    Duplicate
  </button>
  <button
    type="button"
    role="menuitem"
    class="px-3 py-1.5 text-left hover:opacity-80"
    style="color: var(--color-error);"
    onclick={onDelete}
  >
    Delete
  </button>
</div>
