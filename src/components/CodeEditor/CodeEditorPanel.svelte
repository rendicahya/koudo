<script lang="ts">
  import JavaCodeEditor from './JavaCodeEditor.svelte';
  import PseudocodeView from './PseudocodeView.svelte';

  const TABS = ['Java', 'Pseudocode'] as const;
  type Tab = (typeof TABS)[number];

  let activeTab = $state<Tab>('Java');
  let javaEditorRef: ReturnType<typeof JavaCodeEditor> | undefined;

  $effect(() => {
    if (activeTab === 'Java') javaEditorRef?.refreshLayout();
  });
</script>

<div class="flex h-full w-full flex-col">
  <div
    role="tablist"
    class="flex shrink-0 border-b"
    style="border-color: var(--color-border); background: var(--color-panel);"
  >
    {#each TABS as tab (tab)}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === tab}
        class="border-b-2 px-4 py-1.5 text-sm font-medium"
        style="border-color: {activeTab === tab
          ? 'var(--color-accent)'
          : 'transparent'}; color: {activeTab === tab ? 'var(--color-text)' : 'var(--color-text-secondary)'};"
        onclick={() => (activeTab = tab)}
      >
        {tab}
      </button>
    {/each}
  </div>

  <!-- Both views stay mounted (just hidden) rather than being torn down on
       tab switch — Monaco is expensive to recreate, and hiding preserves its
       scroll position/cursor when the user switches back. -->
  <div class="min-h-0 flex-1" style="display: {activeTab === 'Java' ? 'block' : 'none'};">
    <JavaCodeEditor bind:this={javaEditorRef} />
  </div>
  <div class="min-h-0 flex-1 overflow-hidden" style="display: {activeTab === 'Pseudocode' ? 'block' : 'none'};">
    <PseudocodeView />
  </div>
</div>
