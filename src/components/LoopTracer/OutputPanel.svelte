<script lang="ts">
  import { runOutput, runError, hasRun } from '../../stores/run';
</script>

<div class="flex h-full flex-col gap-3 p-4 text-sm" style="color: var(--color-text);">
  <div
    class="min-h-0 flex-1 overflow-y-auto rounded-md border p-3 font-mono text-xs"
    style="border-color: var(--color-border); background: var(--color-editor-bg);"
  >
    {#if !$hasRun}
      <p style="color: var(--color-text-secondary);">
        Click ▶ Play in the top bar to run your code and see the output here.
      </p>
    {:else}
      {#each $runOutput as line, i (i)}
        <p class="whitespace-pre-wrap">{line}</p>
      {/each}
      {#if $runError}
        <p class="whitespace-pre-wrap" style="color: var(--color-error);">⚠ {$runError}</p>
      {:else if $runOutput.length === 0}
        <p style="color: var(--color-text-secondary);">(no output)</p>
      {/if}
    {/if}
  </div>
</div>
