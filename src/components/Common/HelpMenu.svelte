<script lang="ts">
  import HelpModal from './HelpModal.svelte';
  import { t } from '../../stores/i18n';
  import { reopenTutorial } from '../../stores/tutorial';

  let open = $state(false);
  let helpModalOpen = $state(false);
  let menuEl: HTMLDivElement;

  function handleWindowClick(event: MouseEvent) {
    if (open && menuEl && !menuEl.contains(event.target as globalThis.Node)) {
      open = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="relative" bind:this={menuEl}>
  <button
    type="button"
    class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {$t('nav.help')} ▾
  </button>
  {#if open}
    <div
      role="menu"
      class="absolute left-0 top-full z-20 mt-1 flex w-44 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-md border text-sm shadow-md"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
    >
      <button
        type="button"
        role="menuitem"
        class="px-3 py-1.5 text-left hover:opacity-80"
        onclick={() => {
          open = false;
          helpModalOpen = true;
        }}
      >
        {$t('nav.helpGuide')}
      </button>
      <button
        type="button"
        role="menuitem"
        class="px-3 py-1.5 text-left hover:opacity-80"
        onclick={() => {
          open = false;
          reopenTutorial();
        }}
      >
        {$t('nav.tutorial')}
      </button>
    </div>
  {/if}
</div>

<HelpModal open={helpModalOpen} onclose={() => (helpModalOpen = false)} />
