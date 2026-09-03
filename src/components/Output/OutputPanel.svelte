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
  import { hasConnectedEndBlock, allIfBranchesReachEnd, canRunFlowchart, nodes, edges } from '../../stores/flowchart';
  import { blockTypeOf } from '../../lib/flowchart/graphWalk';
  import { codeContent } from '../../stores/code';
  import { generateJavaMethods } from '../../lib/flowchart/generator';
  import { t } from '../../stores/i18n';
  import { outputFontSize, zoomOutputFontSize, MIN_OUTPUT_FONT_SIZE, MAX_OUTPUT_FONT_SIZE } from '../../stores/layout';

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
    if (!$canRunFlowchart) return;
    stopStepRun();
    // Subroutine Start/End pairs aren't part of $codeContent (that's main's
    // flow alone — see stores/sync.ts) — spliced in here so ▶ Run can
    // actually call them, same source generateJavaMethods feeds the Java
    // tab's compilable output (see CodeEditorPanel.svelte).
    const methods = generateJavaMethods($nodes, $edges);
    runCode(methods ? `${methods}\n\n${$codeContent}` : $codeContent);
  }

  // Starts a step run if none is active yet; otherwise advances the one
  // already running — one line at a time inside a multi-line block, one hop
  // otherwise (see stores/stepRunner.ts) — same as clicking whichever of
  // ⏭ Step / ⏭ Next Step is currently showing.
  function handleStepShortcut() {
    if (!$isStepping) {
      if (!hasStart || !$canRunFlowchart) return;
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
      data-tutorial-run-button
      class="btn btn-accent rounded-md border px-3 py-1.5 text-sm font-medium"
      disabled={!$canRunFlowchart}
      onclick={handleRun}
      title={$hasConnectedEndBlock
        ? $allIfBranchesReachEnd
          ? $t('output.runTitleEnabled')
          : $t('output.runTitleIfIncomplete')
        : $t('output.runTitleDisabled')}
    >
      {$t('output.run')}
    </button>

    {#if !$isStepping}
      <button
        type="button"
        class="btn btn-neutral rounded-md border px-3 py-1.5 text-sm font-medium"
        disabled={!hasStart || !$canRunFlowchart}
        onclick={startStepRun}
        title={!hasStart
          ? $t('output.stepTitleNoStart')
          : !$hasConnectedEndBlock
            ? $t('output.stepTitleNoEnd')
            : !$allIfBranchesReachEnd
              ? $t('output.stepTitleIfIncomplete')
              : $t('output.stepTitleReady')}
      >
        {$t('output.step')}
      </button>
    {:else}
      <button
        type="button"
        class="btn btn-neutral rounded-md border px-3 py-1.5 text-sm font-medium"
        disabled={$isStepFinished}
        onclick={stepOnce}
        title={$t('output.nextStepTitle')}
      >
        {$t('output.nextStep')}
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
      {$t('output.stop')}
    </button>
  </div>

  <div class="flex shrink-0 flex-wrap items-center gap-2">
    <p class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">{$t('output.heading')}</p>
    <button
      type="button"
      class="btn btn-neutral rounded-md border px-2 py-1 text-xs font-medium hover:opacity-80"
      disabled={$isStepping || !$hasRun}
      title={$isStepping ? $t('output.clearTitleStepping') : $t('output.clearTitleReady')}
      onclick={clearRunOutput}
    >
      {$t('output.clear')}
    </button>

    <!-- Zoom for the Run/Step output box only — not the Variable Watcher
         table beside it, which stays a fixed size (its own columns are
         already tight on space). Same shared-zoom pattern as
         CodeEditorPanel's own text-size buttons, just a separate setting
         (see stores/layout.ts's outputFontSize). -->
    <div class="flex items-center gap-1 text-xs" style="color: var(--color-text-secondary);">
      <button
        type="button"
        class="rounded border px-1.5 py-0.5 leading-none hover:opacity-70 disabled:opacity-40"
        style="border-color: var(--color-border);"
        disabled={$outputFontSize <= MIN_OUTPUT_FONT_SIZE}
        title={$t('code.decreaseTextSize')}
        aria-label={$t('code.decreaseTextSize')}
        onclick={() => zoomOutputFontSize(-1)}
      >
        −
      </button>
      <span class="w-8 text-center tabular-nums">{$outputFontSize}px</span>
      <button
        type="button"
        class="rounded border px-1.5 py-0.5 leading-none hover:opacity-70 disabled:opacity-40"
        style="border-color: var(--color-border);"
        disabled={$outputFontSize >= MAX_OUTPUT_FONT_SIZE}
        title={$t('code.increaseTextSize')}
        aria-label={$t('code.increaseTextSize')}
        onclick={() => zoomOutputFontSize(1)}
      >
        +
      </button>
    </div>
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
      <span style="color: var(--color-text-secondary);"
        >{$t('output.line', { index: $stepCurrentLine.index, total: $stepCurrentLine.total })}</span
      >
      {$stepCurrentLine.text}
    </p>
  {/if}

  {#if $isStepping && $isStepFinished && $stepStatus}
    <p class="shrink-0" style="color: var(--color-text-secondary);">{$stepStatus}</p>
  {/if}

  <div class="flex min-h-0 flex-1 flex-row gap-3">
    <div
      class="min-h-0 flex-1 overflow-y-auto rounded-md border p-3 font-mono"
      style="border-color: var(--color-border); background: var(--color-editor-bg); font-size: {$outputFontSize}px;"
    >
      {#if !$isStepping && !$hasRun}
        <p style="color: var(--color-text-secondary);">
          {$t('output.emptyPrompt', { run: $t('output.run'), step: $t('output.step') })}
        </p>
      {:else}
        {#each displayOutput as line, i (i)}
          <p class="whitespace-pre-wrap">{line}</p>
        {/each}
        {#if displayError}
          <p class="whitespace-pre-wrap" style="color: var(--color-error);">⚠ {displayError}</p>
        {:else if displayOutput.length === 0}
          <p style="color: var(--color-text-secondary);">{$t('output.noOutput')}</p>
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
        {$t('output.variables')}
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
                  {$isStepping || $hasRun ? $t('output.noVariablesRun') : $t('output.noVariablesPrompt')}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
