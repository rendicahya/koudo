<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import { arrangeNodesVertically, nodes, edges } from '../../stores/flowchart';
  import { downloadDataUrl, sanitizeFilename } from '../../lib/download';
  import { flowchartToPngDataUrl } from '../../lib/flowchart/exportPng';
  import { t } from '../../stores/i18n';
  import { projectName } from '../../stores/project';
  import type { TranslationKey } from '../../lib/i18n/translations';

  // Arrange/PNG both act on the canvas as a whole (not any one block), so
  // they get their own menu rather than crowding the toolbar as standalone
  // buttons.
  type CanvasAction = 'arrange' | 'downloadPng';
  const CANVAS_ACTIONS: { id: CanvasAction; labelKey: TranslationKey; titleKey: TranslationKey }[] = [
    { id: 'arrange', labelKey: 'nav.arrange', titleKey: 'nav.arrangeTitle' },
    { id: 'downloadPng', labelKey: 'nav.downloadPng', titleKey: 'nav.downloadPngTitle' },
  ];

  let open = $state(false);
  let menuEl: HTMLDivElement;

  // Requires this component to sit inside a SvelteFlowProvider (hoisted up to
  // App.svelte for exactly this reason, since TopNavbar and FlowchartCanvas
  // are siblings there).
  const { getNodesBounds } = useSvelteFlow();

  function handleArrange() {
    $nodes = arrangeNodesVertically($nodes, $edges);
  }

  // The visible canvas background (--color-canvas) rather than the page/panel
  // background — a transparent PNG would otherwise show whatever's behind it
  // in a viewer instead of matching what the user actually saw on screen.
  // Queried off document.documentElement/a global selector rather than a
  // bound ref, since there's only ever one canvas on the page and neither is
  // reachable from here otherwise (this component sits outside
  // FlowchartBoard).
  async function handleDownloadPng() {
    const viewportEl = document.querySelector<HTMLElement>('.svelte-flow__viewport');
    if (!viewportEl) return;

    try {
      const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas').trim();
      const dataUrl = await flowchartToPngDataUrl(viewportEl, $nodes, backgroundColor, getNodesBounds);
      downloadDataUrl(`${sanitizeFilename($projectName)}.png`, dataUrl);
    } catch (err) {
      // html-to-image's toPng() rejects (rather than resolving to a broken
      // image) on things like a cross-origin/tainted canvas — surface it
      // instead of failing the click silently, same as Open/Save Project's
      // own error handling.
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleAction(action: CanvasAction) {
    open = false;
    if (action === 'arrange') return handleArrange();
    if (action === 'downloadPng') return handleDownloadPng();
  }

  function handleWindowClick(event: MouseEvent) {
    if (open && menuEl && !menuEl.contains(event.target as globalThis.Node)) {
      open = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      open = false;
      return;
    }
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;

    // Alt+Shift+<letter>, matching the pattern already used for the theme
    // toggle — avoids Ctrl combos, which Monaco and the browser both claim
    // heavily. Run/Step's own Alt+Shift+R/S live with their buttons now (see
    // OutputPanel.svelte).
    if (event.key.toLowerCase() === 'a') {
      event.preventDefault();
      handleArrange();
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="relative" bind:this={menuEl}>
  <button
    type="button"
    data-tutorial-canvas-menu
    class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {$t('nav.canvas')} ▾
  </button>
  {#if open}
    <div
      role="menu"
      class="absolute left-0 top-full z-20 mt-1 flex w-44 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-md border text-sm shadow-md"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
    >
      {#each CANVAS_ACTIONS as action (action.id)}
        <button
          type="button"
          role="menuitem"
          class="px-3 py-1.5 text-left hover:opacity-80"
          title={$t(action.titleKey)}
          onclick={() => handleAction(action.id)}
        >
          {$t(action.labelKey)}
        </button>
      {/each}
    </div>
  {/if}
</div>
