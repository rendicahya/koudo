<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import HelpModal from './HelpModal.svelte';
  import { codeContent } from '../../stores/code';
  import { runCode } from '../../stores/run';
  import {
    hasConnectedEndBlock,
    resetFlowchart,
    loadFlowchart,
    arrangeNodesVertically,
    nodes,
    edges,
  } from '../../stores/flowchart';
  import { downloadTextFile, downloadDataUrl } from '../../lib/download';
  import { serializeFlowchart, parseFlowchartFile } from '../../lib/storage/flowchartFile';
  import { wrapAsJavaFile } from '../../lib/flowchart/exportJava';
  import { generatePseudocode } from '../../lib/flowchart/generatorPseudocode';
  import { flowchartToPngDataUrl } from '../../lib/flowchart/exportPng';
  import { blockTypeOf } from '../../lib/flowchart/graphWalk';
  import { isStepping, isStepFinished, startStepRun, stepOnce, stopStepRun } from '../../stores/stepRunner';
  import { variableMode, setVariableMode, type VariableMode } from '../../stores/settings';

  // New/Open/Save all act on the same thing — the flowchart project — so
  // they live under one "Project" menu; Export Java joins them there too,
  // even though it produces something different (a Java source file, not a
  // project), since it's still a whole-project action rather than a
  // canvas-editing one.
  const projectActions = ['New', 'Open Project', 'Save Project', 'Export Java', 'Export Pseudocode'] as const;
  // Arrange/PNG both act on the canvas as a whole (not any one block), so
  // they get their own menu rather than crowding the toolbar as standalone
  // buttons.
  const canvasActions = ['Arrange', 'Download PNG'] as const;
  // Also lives in the Project menu, as a second group below the actions
  // above — it's a project-wide setting (persisted, see stores/settings.ts),
  // not a one-off action, but there's no other menu it fits better than this
  // one.
  const variableModeOptions: { mode: VariableMode; label: string; hint: string }[] = [
    { mode: 'inferred', label: 'Beginner Mode', hint: 'Declare a variable with just a value — its type is inferred automatically' },
    { mode: 'explicit', label: 'Standard Mode', hint: 'Declare a variable by choosing its data type explicitly' },
  ];

  let projectMenuOpen = $state(false);
  let projectMenuEl: HTMLDivElement;
  let canvasMenuOpen = $state(false);
  let canvasMenuEl: HTMLDivElement;
  let helpOpen = $state(false);
  let fileInputEl: HTMLInputElement;

  // Only used by Download PNG — see useSvelteFlow requiring this component to
  // sit inside a SvelteFlowProvider (hoisted up to App.svelte for exactly
  // this reason, since TopNavbar and FlowchartCanvas are siblings there).
  const { getNodesBounds } = useSvelteFlow();

  let hasStart = $derived($nodes.some((node) => blockTypeOf(node) === 'start'));

  function handleRun() {
    if (!$hasConnectedEndBlock) return;
    stopStepRun();
    runCode($codeContent);
  }

  function handleNew() {
    if (!confirm('Clear the canvas and start a new flowchart? This cannot be undone.')) return;
    stopStepRun();
    resetFlowchart();
  }

  function handleSave() {
    downloadTextFile('flowchart.koudo.json', serializeFlowchart($nodes, $edges), 'application/json');
  }

  function handleExport() {
    downloadTextFile('Main.java', wrapAsJavaFile($codeContent), 'text/x-java-source');
  }

  function handleExportPseudocode() {
    downloadTextFile('flowchart.pseudocode.txt', generatePseudocode($nodes, $edges), 'text/plain');
  }

  function handleArrange() {
    $nodes = arrangeNodesVertically($nodes, $edges);
  }

  // The visible canvas background (--color-canvas) rather than the page/panel
  // background — a transparent PNG would otherwise show whatever's behind
  // it in a viewer instead of matching what the user actually saw on screen.
  // Queried off document.documentElement/a global selector rather than a
  // bound ref, since there's only ever one canvas on the page and neither is
  // reachable from here otherwise (TopNavbar sits outside FlowchartBoard).
  async function handleDownloadPng() {
    const viewportEl = document.querySelector<HTMLElement>('.svelte-flow__viewport');
    if (!viewportEl) return;

    try {
      const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas').trim();
      const dataUrl = await flowchartToPngDataUrl(viewportEl, $nodes, backgroundColor, getNodesBounds);
      downloadDataUrl('flowchart.png', dataUrl);
    } catch (err) {
      // html-to-image's toPng() rejects (rather than resolving to a broken
      // image) on things like a cross-origin/tainted canvas — surface it
      // instead of failing the click silently, same as Open/Save Project's
      // own error handling.
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleOpen() {
    if (!confirm('Clear the canvas and open a different flowchart? This cannot be undone.')) return;
    fileInputEl.click();
  }

  // The file input's own onchange — separate from handleOpen since it can
  // also fire from a file picked after handleOpen's confirm, asynchronously.
  async function handleFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // otherwise re-picking the same file wouldn't fire another change event

    if (!file) return;
    try {
      const project = parseFlowchartFile(await file.text());
      stopStepRun();
      loadFlowchart(project.nodes, project.edges);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleProjectAction(action: (typeof projectActions)[number]) {
    projectMenuOpen = false;
    if (action === 'New') return handleNew();
    if (action === 'Open Project') return handleOpen();
    if (action === 'Save Project') return handleSave();
    if (action === 'Export Java') return handleExport();
    if (action === 'Export Pseudocode') return handleExportPseudocode();
  }

  function handleCanvasAction(action: (typeof canvasActions)[number]) {
    canvasMenuOpen = false;
    if (action === 'Arrange') return handleArrange();
    if (action === 'Download PNG') return handleDownloadPng();
  }

  // Starts a step run if none is active yet; otherwise advances the one
  // already running — one line at a time inside a multi-line block, one hop
  // otherwise (see stores/stepRunner.ts) — same as clicking whichever of
  // ⏭ Step Through / ⏭ Next Step is currently showing.
  function handleStepShortcut() {
    if (!$isStepping) {
      if (!hasStart || !$hasConnectedEndBlock) return;
      return startStepRun();
    }
    if (!$isStepFinished) stepOnce();
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      projectMenuOpen = false;
      canvasMenuOpen = false;
      helpOpen = false;
    }
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;

    // Alt+Shift+<letter>, matching the pattern already used for the theme
    // toggle — avoids Ctrl combos, which Monaco and the browser both claim
    // heavily.
    const key = event.key.toLowerCase();
    if (key === 'r') {
      event.preventDefault();
      handleRun();
    } else if (key === 's') {
      event.preventDefault();
      handleStepShortcut();
    } else if (key === 'a') {
      event.preventDefault();
      handleArrange();
    }
  }

  function handleWindowClick(event: MouseEvent) {
    if (projectMenuOpen && projectMenuEl && !projectMenuEl.contains(event.target as globalThis.Node)) {
      projectMenuOpen = false;
    }
    if (canvasMenuOpen && canvasMenuEl && !canvasMenuEl.contains(event.target as globalThis.Node)) {
      canvasMenuOpen = false;
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} onclick={handleWindowClick} />

<header
  class="flex items-center justify-between border-b px-4 py-2"
  style="border-color: var(--color-border); background: var(--color-panel);"
>
  <div class="flex items-center gap-2 font-semibold" style="color: var(--color-text);">
    <span>💻</span>
    <span>KOUDO</span>
    <span class="text-sm font-normal" style="color: var(--color-text-secondary);">コウド</span>
  </div>

  <div class="flex items-center gap-2">
    <button
      type="button"
      class="btn btn-accent rounded-md border px-3 py-1.5 text-sm font-medium"
      disabled={!$hasConnectedEndBlock}
      onclick={handleRun}
      title={$hasConnectedEndBlock
        ? 'Run the code (Alt+Shift+R) — output appears in the panel below'
        : 'Connect an End block to the flowchart before running'}
    >
      ▶ Run
    </button>

    {#if !$isStepping}
      <button
        type="button"
        class="btn btn-neutral rounded-md border px-3 py-1.5 text-sm font-medium"
        disabled={!hasStart || !$hasConnectedEndBlock}
        onclick={startStepRun}
        title={!hasStart
          ? 'Add a Start block first'
          : !$hasConnectedEndBlock
            ? 'Connect an End block to the flowchart before stepping through'
            : 'Run one line at a time, highlighting each block on the canvas (Alt+Shift+S)'}
      >
        ⏭ Step Through
      </button>
    {:else}
      <button
        type="button"
        class="btn btn-neutral rounded-md border px-3 py-1.5 text-sm font-medium"
        disabled={$isStepFinished}
        onclick={stepOnce}
        title="Run the next line (Alt+Shift+S)"
      >
        ⏭ Next Step
      </button>
    {/if}

    <!-- Always shown (not just once stepping starts), just disabled until
         then — so its place in the toolbar is predictable instead of
         buttons shifting around it as a step run starts/stops. -->
    <button
      type="button"
      class="btn btn-neutral rounded-md border px-3 py-1.5 text-sm font-medium"
      disabled={!$isStepping}
      onclick={stopStepRun}
    >
      ⏹ Stop
    </button>

    <nav class="flex items-center gap-2">
      <div class="relative" bind:this={projectMenuEl}>
        <button
          type="button"
          class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          aria-haspopup="menu"
          aria-expanded={projectMenuOpen}
          onclick={() => (projectMenuOpen = !projectMenuOpen)}
        >
          Project ▾
        </button>
        {#if projectMenuOpen}
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col overflow-hidden rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each projectActions as action (action)}
              <button
                type="button"
                role="menuitem"
                class="px-3 py-1.5 text-left hover:opacity-80"
                onclick={() => handleProjectAction(action)}
              >
                {action}
              </button>
            {/each}

            <div class="border-t" style="border-color: var(--color-border);"></div>

            {#each variableModeOptions as option (option.mode)}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={$variableMode === option.mode}
                class="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
                title={option.hint}
                onclick={() => {
                  projectMenuOpen = false;
                  setVariableMode(option.mode);
                }}
              >
                <span>{option.label}</span>
                {#if $variableMode === option.mode}
                  <span style="color: var(--color-accent);">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="relative" bind:this={canvasMenuEl}>
        <button
          type="button"
          class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          aria-haspopup="menu"
          aria-expanded={canvasMenuOpen}
          onclick={() => (canvasMenuOpen = !canvasMenuOpen)}
        >
          Canvas ▾
        </button>
        {#if canvasMenuOpen}
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-1 flex w-44 flex-col overflow-hidden rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each canvasActions as action (action)}
              <button
                type="button"
                role="menuitem"
                class="px-3 py-1.5 text-left hover:opacity-80"
                title={action === 'Arrange'
                  ? 'Arrange blocks into a straight vertical line (Alt+Shift+A)'
                  : 'Download the flowchart as a PNG image'}
                onclick={() => handleCanvasAction(action)}
              >
                {action}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <button
        type="button"
        class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
        onclick={() => (helpOpen = true)}
      >
        Help
      </button>
    </nav>

    <input
      bind:this={fileInputEl}
      type="file"
      accept=".json,application/json"
      class="hidden"
      onchange={handleFileSelected}
    />
  </div>

  <ThemeToggle />
</header>

<HelpModal open={helpOpen} onclose={() => (helpOpen = false)} />
