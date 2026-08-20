<script lang="ts">
  import '@xyflow/svelte/dist/style.css';
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import TopNavbar from './components/Common/TopNavbar.svelte';
  import Toast from './components/Common/Toast.svelte';
  import FlowchartCanvas from './components/Flowchart/FlowchartCanvas.svelte';
  import JavaCodeEditor from './components/CodeEditor/JavaCodeEditor.svelte';
  import OutputPanel from './components/Output/OutputPanel.svelte';
  import { loadLayoutPrefs, saveLayoutPrefs } from './lib/storage/layoutPrefs';
  import { isFlowchartDirty } from './stores/flowchart';
  import { toggleTheme } from './stores/theme';
  import { isCodePanelHidden, toggleCodePanel } from './stores/layout';

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!$isFlowchartDirty) return;
    event.preventDefault();
    event.returnValue = '';
  }

  // Alt+Shift+T toggles dark/light mode from anywhere, including while the
  // Monaco editor has focus. Deliberately not a Ctrl/Cmd combo — Monaco
  // claims most of those by default (e.g. Ctrl+Shift+L is "select all
  // occurrences"), and Ctrl+letter often collides with browser shortcuts.
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      toggleTheme();
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

  <main bind:this={mainEl} class="flex flex-1 flex-col overflow-hidden md:flex-row">
    <section
      class="flowchart-panel {$isCodePanelHidden ? 'h-full' : 'h-1/2 border-b md:border-b-0'} md:h-full"
      style="border-color: var(--color-border); --flowchart-percent: {flowchartPercent}%; {$isCodePanelHidden
        ? 'width: 100%;'
        : ''}"
    >
      <FlowchartCanvas />
    </section>

    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize flowchart and code panels"
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
        title={$isCodePanelHidden ? 'Show the code panel' : 'Hide the code panel'}
        onpointerdown={(event) => event.stopPropagation()}
        onclick={(event) => {
          event.stopPropagation();
          toggleCodePanel();
        }}
      >
        {$isCodePanelHidden ? '⏴' : '⏵'}
      </button>
    </div>

    {#if !$isCodePanelHidden}
      <section class="code-column flex h-1/2 flex-1 flex-col overflow-hidden md:h-full">
        <div class="min-h-0 flex-1" style="background: var(--color-editor-bg);">
          <JavaCodeEditor />
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize output panel"
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
    {/if}
  </main>
</div>
<Toast />
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
