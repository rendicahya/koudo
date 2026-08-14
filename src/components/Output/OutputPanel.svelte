<script lang="ts">
  import { runOutput, runError, hasRun, clearRunOutput } from '../../stores/run';
  import {
    isStepping,
    isStepFinished,
    stepOutput,
    stepError,
    stepStatus,
    stepVariables,
    stepCurrentLine,
  } from '../../stores/stepRunner';

  // While a step run is active it takes over the panel — Start/Next/Stop
  // live next to ▶ Run in the top bar (see TopNavbar.svelte). Stopping just
  // switches this back; the last full ▶ Run's output/error underneath is
  // untouched.
  let displayOutput = $derived($isStepping ? $stepOutput : $runOutput);
  let displayError = $derived($isStepping ? $stepError : $runError);
</script>

<div class="flex h-full flex-col gap-3 p-4 text-sm" style="color: var(--color-text);">
  <div class="flex shrink-0 items-center justify-between">
    <p class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">Output</p>
    <button
      type="button"
      class="rounded-md border px-2 py-1 text-xs font-medium hover:opacity-80"
      style="border-color: var(--color-border); color: var(--color-text); opacity: {$isStepping || !$hasRun ? 0.5 : 1};"
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
        <p style="color: var(--color-text-secondary);">
          Click ▶ Run, or ⏭ Step Through, in the top bar to see output here.
        </p>
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

    {#if $isStepping}
      <!-- Variable Watcher — live values in scope as of the most recent
           step, refreshed by stepRunner.ts on every stepOnce(). -->
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
              {#each $stepVariables as v (v.name)}
                <tr style="border-top: 1px solid var(--color-border);">
                  <td class="px-2 py-1 font-mono">{v.name}</td>
                  <td class="px-2 py-1 font-mono" style="color: var(--color-text-secondary);">{v.type}</td>
                  <td class="px-2 py-1 font-mono">{v.value}</td>
                </tr>
              {:else}
                <tr>
                  <td class="px-2 py-2 text-center" colspan="3" style="color: var(--color-text-secondary);">
                    No variables yet
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
