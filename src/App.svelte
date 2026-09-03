<script lang="ts">
  import '@xyflow/svelte/dist/style.css';
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import TopNavbar from './components/Common/TopNavbar.svelte';
  import Toast from './components/Common/Toast.svelte';
  import TutorialWelcomeModal from './components/Common/TutorialWelcomeModal.svelte';
  import TutorialCoach from './components/Common/TutorialCoach.svelte';
  import FlowchartCanvas from './components/Flowchart/FlowchartCanvas.svelte';
  import CodeEditorPanel from './components/CodeEditor/CodeEditorPanel.svelte';
  import OutputPanel from './components/Output/OutputPanel.svelte';
  import { loadLayoutPrefs, saveLayoutPrefs } from './lib/storage/layoutPrefs';
  import { isFlowchartDirty } from './stores/flowchart';
  import { undo, redo } from './stores/history';
  import { toggleTheme } from './stores/theme';
  import { isCodePanelHidden, toggleCodePanel, activeCodeTab, type CodeTab } from './stores/layout';
  import { t } from './stores/i18n';
  import type { TranslationKey } from './lib/i18n/translations';

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!$isFlowchartDirty) return;
    event.preventDefault();
    event.returnValue = '';
  }

  // Alt+Shift+T toggles dark/light mode from anywhere, including while the
  // Monaco editor has focus. Deliberately not a Ctrl/Cmd combo — Monaco
  // claims most of those by default (e.g. Ctrl+Shift+L is "select all
  // occurrences"), and Ctrl+letter often collides with browser shortcuts.
  // Ctrl/Cmd+Z (Shift held = redo) and Ctrl/Cmd+Y, the conventional
  // undo/redo shortcuts — but only when focus isn't inside a text field, so
  // this doesn't hijack a browser-native text undo mid-edit in one of the
  // canvas blocks' own <input>s (see isEditableTarget below).
  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      toggleTheme();
      return;
    }

    if (!(event.ctrlKey || event.metaKey) || event.altKey || isEditableTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (key === 'y') {
      event.preventDefault();
      redo();
    }
  }

  const MIN_FLOWCHART_PERCENT = 20;
  const MAX_FLOWCHART_PERCENT = 65;
  const MIN_OUTPUT_HEIGHT = 120;
  const MAX_OUTPUT_HEIGHT = 600;
  const MIN_MAIN_HEIGHT = 200;

  const initialLayout = loadLayoutPrefs(
    { flowchartPercent: 35, outputHeight: 224 },
    { percent: [MIN_FLOWCHART_PERCENT, MAX_FLOWCHART_PERCENT], height: [MIN_OUTPUT_HEIGHT, MAX_OUTPUT_HEIGHT] },
  );

  let mainEl: HTMLElement;
  let flowchartPercent = $state(initialLayout.flowchartPercent);
  let outputHeight = $state(initialLayout.outputHeight);

  $effect(() => {
    saveLayoutPrefs({ flowchartPercent, outputHeight });
  });

  // Below md (see the resizable side-by-side layout further down), the
  // flowchart and code panels no longer share the screen at all — each
  // mobile tab shows exactly one, full height, so editing a flowchart on a
  // phone isn't squeezed into half a short screen. Not persisted (unlike
  // flowchartPercent/outputHeight above) — same "resets on reload" as
  // BlockPalette's own minimized state, since which one someone last looked
  // at isn't meaningful to remember across a session.
  type MobileTab = 'flowchart' | 'pseudocode' | 'java';
  const MOBILE_TABS: { id: MobileTab; labelKey: TranslationKey; codeTab?: CodeTab }[] = [
    { id: 'flowchart', labelKey: 'help.tab.flowchart' },
    { id: 'pseudocode', labelKey: 'code.pseudocodeTab', codeTab: 'Pseudocode' },
    { id: 'java', labelKey: 'code.javaTab', codeTab: 'Java' },
  ];
  let mobileTab = $state<MobileTab>('flowchart');

  // Driving activeCodeTab (not local state of its own) means switching to
  // the Pseudocode/Java mobile tab shows the exact same view CodeEditorPanel
  // already renders for that choice on desktop — no separate mobile-only
  // code path to keep in sync with it.
  function selectMobileTab(tab: MobileTab) {
    mobileTab = tab;
    const codeTab = MOBILE_TABS.find((entry) => entry.id === tab)?.codeTab;
    if (codeTab) activeCodeTab.set(codeTab);
  }

  // Pointer capture keeps move/up events targeted at the resizer itself even
  // once the cursor crosses into the Monaco editor or SvelteFlow canvas,
  // both of which otherwise intercept pointermove for their own dragging.
  function trackDrag(target: HTMLElement, pointerId: number, onMove: (event: PointerEvent) => void) {
    target.setPointerCapture(pointerId);

    function handleMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      onMove(event);
    }
    function handleUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      target.releasePointerCapture(pointerId);
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', handleUp);
  }

  function beginColumnResize(event: PointerEvent) {
    event.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    trackDrag(event.currentTarget as HTMLElement, event.pointerId, (moveEvent) => {
      const rect = mainEl.getBoundingClientRect();
      const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      flowchartPercent = Math.min(MAX_FLOWCHART_PERCENT, Math.max(MIN_FLOWCHART_PERCENT, percent));
    });
  }

  function beginRowResize(event: PointerEvent) {
    event.preventDefault();
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    trackDrag(event.currentTarget as HTMLElement, event.pointerId, (moveEvent) => {
      const maxHeight = Math.min(MAX_OUTPUT_HEIGHT, window.innerHeight - MIN_MAIN_HEIGHT);
      const height = window.innerHeight - moveEvent.clientY;
      outputHeight = Math.min(maxHeight, Math.max(MIN_OUTPUT_HEIGHT, height));
    });
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} onkeydown={handleGlobalKeydown} />

<!-- Hoisted above TopNavbar (not just around FlowchartCanvas) so its Canvas
     menu (Arrange/PNG) can call useSvelteFlow() itself, instead of needing
     the actual canvas DOM/hooks threaded down from FlowchartBoard. -->
<SvelteFlowProvider>
<div class="flex h-screen flex-col">
  <TopNavbar />

  <!-- Below md, the resizable side-by-side layout further down gives way to
       one full-height panel at a time — this is what picks which. -->
  <nav
    class="flex shrink-0 border-b md:hidden"
    style="border-color: var(--color-border); background: var(--color-panel);"
  >
    {#each MOBILE_TABS as tab (tab.id)}
      <button
        type="button"
        role="tab"
        aria-selected={mobileTab === tab.id}
        class="flex-1 border-b-2 px-3 py-2 text-sm font-medium"
        style="border-color: {mobileTab === tab.id
          ? 'var(--color-accent)'
          : 'transparent'}; color: {mobileTab === tab.id ? 'var(--color-text)' : 'var(--color-text-secondary)'};"
        onclick={() => selectMobileTab(tab.id)}
      >
        {$t(tab.labelKey)}
      </button>
    {/each}
  </nav>

  <main bind:this={mainEl} class="flex flex-1 flex-col overflow-hidden md:flex-row">
    <section
      class="flowchart-panel {mobileTab === 'flowchart' ? '' : 'hidden'} md:block {$isCodePanelHidden
        ? 'h-full'
        : 'h-1/2 border-b md:border-b-0'} md:h-full"
      style="border-color: var(--color-border); --flowchart-percent: {flowchartPercent}%; {$isCodePanelHidden
        ? 'width: 100%;'
        : ''}"
    >
      <FlowchartCanvas />
    </section>

    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={$t('app.resizeColumnsAriaLabel')}
      class="resizer hidden shrink-0 md:block"
      onpointerdown={$isCodePanelHidden ? undefined : beginColumnResize}
    >
      <!-- The hide/show toggle lives on the divider itself rather than the
           top bar — it acts on this boundary, so it reads more directly
           parked right on it. Stops both pointerdown and click from
           reaching the divider's own drag handler above, or clicking it
           would also kick off a resize-drag. -->
      <button
        type="button"
        class="btn-panel absolute left-1/2 top-1/2 z-10 flex h-9 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border text-xs shadow-sm hover:opacity-80"
        title={$isCodePanelHidden ? $t('app.showCodePanel') : $t('app.hideCodePanel')}
        onpointerdown={(event) => event.stopPropagation()}
        onclick={(event) => {
          event.stopPropagation();
          toggleCodePanel();
        }}
      >
        {$isCodePanelHidden ? '⏴' : '⏵'}
      </button>
    </div>

    <!-- Always rendered (not gated by an {#if}) — same "stays mounted, just
         hidden" reasoning as CodeEditorPanel's own Pseudocode/Java toggle,
         so switching mobile tabs (or the desktop hide/show toggle above)
         never has to pay Monaco's mount cost again. Mobile: shown unless the
         Flowchart tab is active. Desktop: shown unless isCodePanelHidden —
         md:flex/md:hidden unconditionally override the mobile-only class at
         that breakpoint. -->
    <section
      class="code-column {mobileTab === 'flowchart'
        ? 'hidden'
        : 'flex'} h-1/2 flex-1 flex-col overflow-hidden md:h-full {$isCodePanelHidden ? 'md:hidden' : 'md:flex'}"
    >
      <div class="min-h-0 flex-1" style="background: var(--color-editor-bg);">
        <CodeEditorPanel />
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={$t('app.resizeRowAriaLabel')}
        class="resizer resizer-horizontal shrink-0"
        onpointerdown={beginRowResize}
      ></div>

      <footer
        class="flex shrink-0 flex-col overflow-hidden border-t"
        style="height: {outputHeight}px; border-color: var(--color-border); background: var(--color-panel);"
      >
        <div class="min-h-0 flex-1">
          <OutputPanel />
        </div>
      </footer>
    </section>
  </main>
</div>
<Toast />
<TutorialWelcomeModal />
<TutorialCoach />
</SvelteFlowProvider>

<style>
  @media (min-width: 768px) {
    .flowchart-panel {
      width: var(--flowchart-percent, 35%);
      /* Flex items default to min-width: auto (their content's min-content
         size), which silently blocks shrinking below that. Monaco's
         unwrapped code lines and SvelteFlow's canvas both have a sizable
         min-content width, so without this the panels refuse to shrink
         past a point no matter what width we ask for. */
      min-width: 0;
    }
    .code-column {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  .resizer {
    position: relative;
    z-index: 10;
    width: 4px;
    cursor: col-resize;
    background: var(--color-border);
    touch-action: none;
  }

  /* Widen the actual hit area beyond the thin visible bar, without
     affecting layout width — a 4px column is too thin to reliably grab
     with a mouse, unlike the horizontal resizer which spans the full
     window width and is easy to find. */
  .resizer::before {
    content: '';
    position: absolute;
    inset: 0 -5px;
  }

  .resizer:hover,
  .resizer:active {
    background: var(--color-accent);
  }

  .resizer-horizontal {
    width: 100%;
    height: 4px;
    cursor: row-resize;
  }

  .resizer-horizontal::before {
    inset: -5px 0;
  }
</style>
