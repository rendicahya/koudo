<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import { codeContent } from '../../stores/code';
  import { runCode } from '../../stores/run';
  import { hasConnectedEndBlock, resetFlowchart, loadFlowchart, nodes, edges } from '../../stores/flowchart';
  import { downloadTextFile } from '../../lib/download';
  import { serializeFlowchart, parseFlowchartFile } from '../../lib/storage/flowchartFile';
  import { wrapAsJavaFile } from '../../lib/flowchart/exportJava';
  import { blockTypeOf } from '../../lib/flowchart/graphWalk';
  import { isStepping, isStepFinished, startStepRun, stepOnce, stopStepRun } from '../../stores/stepRunner';

  // New/Open/Save all act on the same thing — the flowchart project — so
  // they live under one "Project" menu; Export Java is its own button since
  // it produces something different (a Java source file, not a project).
  const projectActions = ['New', 'Open Project', 'Save Project'] as const;

  let projectMenuOpen = $state(false);
  let projectMenuEl: HTMLDivElement;
  let fileInputEl: HTMLInputElement;

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
  }

  // Starts a step run if none is active yet; otherwise advances the one
  // already running — one line at a time inside a multi-line block, one hop
  // otherwise (see stores/stepRunner.ts) — same as clicking whichever of
  // ⏭ Step Through / ⏭ Next Step is currently showing.
  function handleStepShortcut() {
    if (!$isStepping) return startStepRun();
    if (!$isStepFinished) stepOnce();
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') projectMenuOpen = false;
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;

    // Alt+Shift+<letter>, matching the pattern already used for the theme
    // toggle and Arrange — avoids Ctrl combos, which Monaco and the browser
    // both claim heavily.
    const key = event.key.toLowerCase();
    if (key === 'r') {
      event.preventDefault();
      handleRun();
    } else if (key === 's') {
      event.preventDefault();
      handleStepShortcut();
    }
  }

  function handleWindowClick(event: MouseEvent) {
    if (projectMenuOpen && projectMenuEl && !projectMenuEl.contains(event.target as globalThis.Node)) {
      projectMenuOpen = false;
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
      class="rounded-md border px-3 py-1.5 text-sm font-medium"
      style="border-color: var(--color-accent); color: var(--color-accent); opacity: {$hasConnectedEndBlock
        ? 1
        : 0.5};"
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
        class="rounded-md border px-3 py-1.5 text-sm font-medium"
        style="border-color: var(--color-border); color: var(--color-text); opacity: {hasStart ? 1 : 0.5};"
        disabled={!hasStart}
        onclick={startStepRun}
        title={hasStart
          ? 'Run one line at a time, highlighting each block on the canvas (Alt+Shift+S)'
          : 'Add a Start block first'}
      >
        ⏭ Step Through
      </button>
    {:else}
      <button
        type="button"
        class="rounded-md border px-3 py-1.5 text-sm font-medium"
        style="border-color: var(--color-border); color: var(--color-text); opacity: {$isStepFinished ? 0.5 : 1};"
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
      class="rounded-md border px-3 py-1.5 text-sm font-medium"
      style="border-color: var(--color-border); color: var(--color-text); opacity: {$isStepping ? 1 : 0.5};"
      disabled={!$isStepping}
      onclick={stopStepRun}
    >
      ⏹ Stop
    </button>

    <nav class="flex items-center gap-2">
      <div class="relative" bind:this={projectMenuEl}>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          style="color: var(--color-text);"
          aria-haspopup="menu"
          aria-expanded={projectMenuOpen}
          onclick={() => (projectMenuOpen = !projectMenuOpen)}
        >
          Project ▾
        </button>
        {#if projectMenuOpen}
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-1 flex w-40 flex-col overflow-hidden rounded-md border text-sm shadow-md"
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
          </div>
        {/if}
      </div>

      <button
        type="button"
        class="rounded-md px-3 py-1.5 text-sm hover:opacity-80"
        style="color: var(--color-text);"
        title="Download the generated code as a runnable Main.java"
        onclick={handleExport}
      >
        Export Java
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
