<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';

  const fileActions = ['New', 'Open', 'Save', 'Export'];
</script>

<header
  class="flex items-center justify-between border-b px-4 py-2"
  style="border-color: var(--color-border); background: var(--color-panel);"
>
  <div class="flex items-center gap-2 font-semibold" style="color: var(--color-text);">
    <span>💻</span>
    <span>KOUDO</span>
  </div>

  <nav class="flex items-center gap-2">
    {#each fileActions as action (action)}
      <button
        type="button"
        class="rounded-md px-3 py-1.5 text-sm hover:opacity-80"
        style="color: var(--color-text);"
      >
        {action}
      </button>
    {/each}
  </nav>

  <ThemeToggle />
</header>
