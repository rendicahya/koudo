<script lang="ts">
  import { currentStep, currentStepIndex, isTracing, loopSteps, nextStep, resetTrace } from '../../stores/execution';
</script>

<div class="flex h-full flex-col gap-3 overflow-y-auto p-4 text-sm" style="color: var(--color-text);">
  {#if $loopSteps.length === 0}
    <p style="color: var(--color-text-secondary);">No loop to trace yet.</p>
    <p style="color: var(--color-text-secondary);">
      Drag a <strong style="color: var(--color-text);">For Loop</strong> block onto the canvas to get started.
    </p>
  {:else}
    <p class="font-medium" style="color: var(--color-accent);">CODE INSIDE RUNS: {$loopSteps.length} times</p>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md border px-3 py-1.5"
        style="border-color: var(--color-border);"
        onclick={nextStep}
        disabled={$currentStepIndex >= $loopSteps.length - 1}
      >
        ▶ {$isTracing ? 'Next' : 'Play'}
      </button>
      <button
        type="button"
        class="rounded-md border px-3 py-1.5"
        style="border-color: var(--color-border);"
        onclick={resetTrace}
        disabled={!$isTracing}
      >
        ⏮ Reset
      </button>
    </div>

    {#if $currentStep}
      <div class="rounded-md border p-3" style="border-color: var(--color-border); background: var(--color-panel);">
        <p>Iteration {$currentStep.iteration + 1}: {Object.entries($currentStep.variables).map(([k, v]) => `${k} = ${v}`).join(', ')}</p>
        <p style="color: var(--color-text-secondary);">→ Output: "{$currentStep.output}"</p>
      </div>
    {:else}
      <p style="color: var(--color-text-secondary);">Click Play to trace the loop step by step.</p>
    {/if}
  {/if}
</div>
