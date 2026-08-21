<script lang="ts">
  import { runOutput, runError, runVariables, hasRun, clearRunOutput, runCode } from '../../stores/run';
  import {
    isStepping,
    isStepFinished,
    stepOutput,
    stepError,
    stepStatus,
    stepVariables,
    stepCurrentLine,
    startStepRun,
    stepOnce,
    stopStepRun,
  } from '../../stores/stepRunner';
  import { hasConnectedEndBlock, nodes } from '../../stores/flowchart';
  import { blockTypeOf } from '../../lib/flowchart/graphWalk';
  import { codeContent } from '../../stores/code';

  // While a step run is active it takes over the panel — Start/Next/Stop
  // live next to ▶ Run, right here above the panel. Stopping just switches
  // this back; the last full ▶ Run's output/error underneath is untouched.
  let displayOutput = $derived($isStepping ? $stepOutput : $runOutput);
  let displayError = $derived($isStepping ? $stepError : $runError);
  // The Variable Watcher stays visible at all times (not just mid-Step) —
  // live values while stepping, the last ▶ Run's final values otherwise, so
  // it's still useful right after a normal Run finishes.
  let displayVariables = $derived($isStepping ? $stepVariables : $runVariables);

  let hasStart = $derived($nodes.some((node) => blockTypeOf(node) === 'start'));

  function handleRun() {
    if (!$hasConnectedEndBlock) return;
    stopStepRun();
    runCode($codeContent);
  }

  // Starts a step run if none is active yet; otherwise advances the one
  // already running — one line at a time inside a multi-line block, one hop
  // otherwise (see stores/stepRunner.ts) — same as clicking whichever of
  // ⏭ Step / ⏭ Next Step is currently showing.
  function handleStepShortcut() {
    if (!$isStepping) {
      if (!hasStart || !$hasConnectedEndBlock) return;
      return startStepRun();
    }
    if (!$isStepFinished) stepOnce();
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;

    // Alt+Shift+<letter>, matching the pattern used throughout the app (see
    // TopNavbar.svelte/App.svelte) — avoids Ctrl combos, which Monaco and
    // the browser both claim heavily.
    const key = event.key.toLowerCase();
    if (key === 'r') {
      event.preventDefault();
      handleRun();
    } else if (key === 's') {
      event.preventDefault();
      handleStepShortcut();
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="flex h-full flex-col gap-3 p-4 text-sm" style="color: var(--color-text);">
  <div class="flex shrink-0 items-center gap-2">
    <button
      type="button"
      class="btn btn-accent rounded-md border px-3 py-1.5 text-sm font-medium"
      disabled={!$hasConnectedEndBlock}
      onclick={handleRun}
      title={$hasConnectedEndBlock
        ? 'Run the code (Alt+Shift+R) — output appears below'
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
            ? 'Connect an End block to the flowchart before stepping'
            : 'Run one line at a time, highlighting each block on the canvas (Alt+Shift+S)'}
      >
        ⏭ Step
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
  </div>

  <div class="flex shrink-0 items-center justify-between">
    <p class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">Output</p>
    <button
      type="button"
      class="btn btn-neutral rounded-md border px-2 py-1 text-xs font-medium hover:opacity-80"
      disabled={$isStepping || !$hasRun}
      title={$isStepping ? 'Stop the step run to clear the output' : 'Clear the output'}
      onclick={clearRunOutput}
    >
      Clear
    </button>
  </div>

  {#if $isStepping && $stepCurrentLine}
    <!-- Which line, inside the highlighted block, the next click will run —
         a multi-line block (several variables/prints/assignments/inputs at
         once) would otherwise just look like one undifferentiated step. -->
    <p
      class="shrink-0 truncate rounded-md border px-2 py-1 font-mono text-xs"
      style="border-color: var(--color-border); background: var(--color-editor-bg);"
      title={$stepCurrentLine.text}
    >
      <span style="color: var(--color-text-secondary);">Line {$stepCurrentLine.index}/{$stepCurrentLine.total}:</span>
      {$stepCurrentLine.text}
    </p>
  {/if}

  {#if $isStepping && $isStepFinished && $stepStatus}
    <p class="shrink-0" style="color: var(--color-text-secondary);">{$stepStatus}</p>
  {/if}

  <div class="flex min-h-0 flex-1 gap-3">
    <div
      class="min-h-0 flex-1 overflow-y-auto rounded-md border p-3 font-mono text-xs"
      style="border-color: var(--color-border); background: var(--color-editor-bg);"
    >
      {#if !$isStepping && !$hasRun}
        <p style="color: var(--color-text-secondary);">Click ▶ Run, or ⏭ Step, above to see output here.</p>
      {:else}
        {#each displayOutput as line, i (i)}
          <p class="whitespace-pre-wrap">{line}</p>
        {/each}
        {#if displayError}
          <p class="whitespace-pre-wrap" style="color: var(--color-error);">⚠ {displayError}</p>
        {:else if displayOutput.length === 0}
          <p style="color: var(--color-text-secondary);">(no output)</p>
        {/if}
      {/if}
    </div>

    <!-- Variable Watcher — always visible: live values in scope while a
         step run is active (refreshed by stepRunner.ts on every
         stepOnce()), otherwise the last ▶ Run's final values. -->
    <div
      class="flex w-56 shrink-0 flex-col overflow-hidden rounded-md border"
      style="border-color: var(--color-border);"
    >
      <p
        class="shrink-0 border-b px-2 py-1 text-xs font-semibold tracking-wide uppercase"
        style="border-color: var(--color-border); color: var(--color-text-secondary);"
      >
        Variables
      </p>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <table class="w-full text-left text-xs">
          <tbody>
            {#each displayVariables as v (v.name)}
              <tr style="border-top: 1px solid var(--color-border);">
                <td class="px-2 py-1 font-mono">{v.name}</td>
                <td class="px-2 py-1 font-mono" style="color: var(--color-text-secondary);">{v.type}</td>
                <td class="px-2 py-1 font-mono">{v.value}</td>
              </tr>
            {:else}
              <tr>
                <td class="px-2 py-2 text-center" colspan="3" style="color: var(--color-text-secondary);">
                  {$isStepping || $hasRun ? 'No variables' : 'Run the program to see variables here'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
