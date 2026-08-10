<script lang="ts">
  import TopNavbar from './components/Common/TopNavbar.svelte';
  import FlowchartCanvas from './components/Flowchart/FlowchartCanvas.svelte';
  import JavaCodeEditor from './components/CodeEditor/JavaCodeEditor.svelte';
  import LoopIterationPanel from './components/LoopTracer/LoopIterationPanel.svelte';
  import { loadLayoutPrefs, saveLayoutPrefs } from './lib/storage/layoutPrefs';
  import { isFlowchartDirty } from './stores/flowchart';

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!$isFlowchartDirty) return;
    event.preventDefault();
    event.returnValue = '';
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

<svelte:window onbeforeunload={handleBeforeUnload} />

<div class="flex h-screen flex-col">
  <TopNavbar />

  <main bind:this={mainEl} class="flex flex-1 flex-col overflow-hidden md:flex-row">
    <section
      class="flowchart-panel h-1/2 border-b md:h-full md:border-b-0"
      style="border-color: var(--color-border); --flowchart-percent: {flowchartPercent}%;"
    >
      <FlowchartCanvas />
    </section>

    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize flowchart and code panels"
      class="resizer hidden shrink-0 md:block"
      onpointerdown={beginColumnResize}
    ></div>

    <section class="code-panel h-1/2 md:h-full" style="background: var(--color-editor-bg);">
      <JavaCodeEditor />
    </section>
  </main>

  <div
    role="separator"
    aria-orientation="horizontal"
    aria-label="Resize output panel"
    class="resizer resizer-horizontal shrink-0"
    onpointerdown={beginRowResize}
  ></div>

  <footer
    class="overflow-hidden border-t"
    style="height: {outputHeight}px; border-color: var(--color-border); background: var(--color-panel);"
  >
    <LoopIterationPanel />
  </footer>
</div>

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
    .code-panel {
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
