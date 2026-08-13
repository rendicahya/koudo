<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import { codeContent } from '../../stores/code';
  import { runCode } from '../../stores/run';
  import { hasConnectedEndBlock, resetFlowchart } from '../../stores/flowchart';

  const otherFileActions = ['Open', 'Save', 'Export'];

  function handleRun() {
    if (!$hasConnectedEndBlock) return;
    runCode($codeContent);
  }

  function handleNew() {
    if (!confirm('Clear the canvas and start a new flowchart? This cannot be undone.')) return;
    resetFlowchart();
  }

  // Alt+Shift+R, matching the Alt+Shift+<letter> pattern already used for
  // the theme toggle and Arrange — avoids Ctrl combos, which Monaco and the
  // browser both claim heavily.
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      handleRun();
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

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

    <nav class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md px-3 py-1.5 text-sm hover:opacity-80"
        style="color: var(--color-text);"
        onclick={handleNew}
      >
        New
      </button>
      {#each otherFileActions as action (action)}
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          style="color: var(--color-text);"
        >
          {action}
        </button>
      {/each}
    </nav>
  </div>

  <ThemeToggle />
</header>
