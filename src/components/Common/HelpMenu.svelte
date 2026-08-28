<script lang="ts">
  import HelpModal from './HelpModal.svelte';
  import { t } from '../../stores/i18n';
  import { TUTORIAL_TRACKS, TRACK_LABEL_KEYS, reopenTutorial } from '../../stores/tutorial';

  let open = $state(false);
  let tutorialSubmenuOpen = $state(false);
  let helpModalOpen = $state(false);
  let menuEl: HTMLDivElement;

  function closeMenu() {
    open = false;
    tutorialSubmenuOpen = false;
  }

  function handleWindowClick(event: MouseEvent) {
    if (open && menuEl && !menuEl.contains(event.target as globalThis.Node)) {
      closeMenu();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeMenu();
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
          closeMenu();
          helpModalOpen = true;
        }}
      >
        {$t('nav.helpGuide')}
      </button>

      <div class="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={tutorialSubmenuOpen}
          class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
          onclick={() => (tutorialSubmenuOpen = !tutorialSubmenuOpen)}
        >
          <span>{$t('nav.tutorial')}</span>
          <span style="color: var(--color-text-secondary);">▸</span>
        </button>
        {#if tutorialSubmenuOpen}
          <div
            role="menu"
            class="absolute left-full top-0 z-20 ml-1 flex w-56 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each TUTORIAL_TRACKS as track (track)}
              <button
                type="button"
                role="menuitem"
                class="px-3 py-1.5 text-left hover:opacity-80"
                onclick={() => {
                  closeMenu();
                  reopenTutorial(track);
                }}
              >
                {$t(TRACK_LABEL_KEYS[track])}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<HelpModal open={helpModalOpen} onclose={() => (helpModalOpen = false)} />
