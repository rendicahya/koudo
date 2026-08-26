<script lang="ts">
  import { t } from '../../stores/i18n';
  import type { TranslationKey } from '../../lib/i18n/translations';
  import KoudoTab from './help/KoudoTab.svelte';
  import FlowchartTab from './help/FlowchartTab.svelte';
  import PseudocodeTab from './help/PseudocodeTab.svelte';
  import JavaTab from './help/JavaTab.svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  type HelpTab = 'koudo' | 'flowchart' | 'pseudocode' | 'java';
  const TABS: { id: HelpTab; labelKey: TranslationKey }[] = [
    { id: 'koudo', labelKey: 'help.tab.koudo' },
    { id: 'flowchart', labelKey: 'help.tab.flowchart' },
    { id: 'pseudocode', labelKey: 'help.tab.pseudocode' },
    { id: 'java', labelKey: 'help.tab.java' },
  ];

  let activeTab = $state<HelpTab>('koudo');

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0, 0, 0, 0.5);"
    role="button"
    tabindex="-1"
    aria-label={$t('help.close')}
    onclick={onclose}
    onkeydown={handleKeydown}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      tabindex="-1"
      class="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border shadow-lg"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
      onclick={(event) => event.stopPropagation()}
      onkeydown={() => {}}
    >
      <div class="flex shrink-0 items-center justify-between border-b px-4 py-3" style="border-color: var(--color-border);">
        <h2 id="help-modal-title" class="text-base font-semibold">{$t('help.title')}</h2>
        <button
          type="button"
          class="rounded px-2 leading-none hover:opacity-70"
          style="color: var(--color-text-secondary);"
          title={$t('help.close')}
          onclick={onclose}
        >
          ×
        </button>
      </div>

      <div role="tablist" class="flex shrink-0 gap-1 border-b px-4" style="border-color: var(--color-border);">
        {#each TABS as tab (tab.id)}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            class="border-b-2 px-3 py-2 text-sm font-medium"
            style="border-color: {activeTab === tab.id
              ? 'var(--color-accent)'
              : 'transparent'}; color: {activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-secondary)'};"
            onclick={() => (activeTab = tab.id)}
          >
            {$t(tab.labelKey)}
          </button>
        {/each}
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
        {#if activeTab === 'koudo'}
          <KoudoTab />
        {:else if activeTab === 'flowchart'}
          <FlowchartTab />
        {:else if activeTab === 'pseudocode'}
          <PseudocodeTab />
        {:else if activeTab === 'java'}
          <JavaTab />
        {/if}
      </div>
    </div>
  </div>
{/if}
