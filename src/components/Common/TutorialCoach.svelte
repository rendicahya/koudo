<script lang="ts">
  import { t } from '../../stores/i18n';
  import {
    tutorialActive,
    tutorialTrack,
    tutorialStepIndex,
    tutorialTrackSteps,
    nextTutorialStep,
    prevTutorialStep,
    closeTutorial,
  } from '../../stores/tutorial';

  let steps = $derived(tutorialTrackSteps($tutorialTrack));
  let step = $derived(steps[$tutorialStepIndex]);
  let isFirst = $derived($tutorialStepIndex === 0);
  let isLast = $derived($tutorialStepIndex === steps.length - 1);

  let panelEl: HTMLDivElement = $state()!;
  // Null until the user first drags the panel — it renders anchored to the
  // bottom-right corner (see the template's style below) until then, same
  // as BlockPalette's own "resets on reload" stance on position: this isn't
  // meaningful to persist across sessions, just within one.
  let pos: { x: number; y: number } | null = $state(null);

  // Splits a translated body string on backtick pairs (e.g. "Name it
  // `radius`") into alternating plain-text/code segments — variable names
  // and expressions render in a monospace <code> tag instead of the
  // surrounding prose font. Even indices are plain text, odd are code,
  // since split() alternates outside/inside the pairs by construction.
  function parseInlineCode(text: string): { text: string; code: boolean }[] {
    return text.split('`').map((part, index) => ({ text: part, code: index % 2 === 1 }));
  }

  // Draws attention to whichever palette chip/button this step calls for
  // (see STEP_HIGHLIGHT) by toggling a CSS class on it — re-run on every
  // step change, cleaning up the previous step's highlight first.
  $effect(() => {
    const selector = $tutorialActive ? step?.highlight : undefined;
    const el = selector ? document.querySelector(selector) : null;
    el?.classList.add('tutorial-highlight');
    return () => el?.classList.remove('tutorial-highlight');
  });

  // Pointer events, not native HTML5 drag-and-drop — same reasoning as
  // BlockPalette's and DeclareNode's own drag handles (dataTransfer/
  // dragstart/dragover/drop don't fire reliably for every user).
  function handleDragHandlePointerDown(event: PointerEvent) {
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);

    const rect = panelEl.getBoundingClientRect();
    // Seeds from the panel's current on-screen position the first time it's
    // dragged, so it continues from wherever it visually was (its
    // right/bottom-anchored default spot) instead of jumping to (0, 0).
    if (!pos) pos = { x: rect.left, y: rect.top };
    const grabOffsetX = event.clientX - rect.left;
    const grabOffsetY = event.clientY - rect.top;

    function clamp(x: number, y: number) {
      const maxX = Math.max(window.innerWidth - rect.width, 0);
      const maxY = Math.max(window.innerHeight - rect.height, 0);
      return { x: Math.min(Math.max(x, 0), maxX), y: Math.min(Math.max(y, 0), maxY) };
    }
    function cleanup() {
      handle.releasePointerCapture(pointerId);
      handle.removeEventListener('pointermove', handleMove);
      handle.removeEventListener('pointerup', handleUp);
      handle.removeEventListener('pointercancel', handleCancel);
    }
    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      pos = clamp(moveEvent.clientX - grabOffsetX, moveEvent.clientY - grabOffsetY);
    }
    function handleUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return;
      cleanup();
    }
    function handleCancel(cancelEvent: PointerEvent) {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
    }
    handle.addEventListener('pointermove', handleMove);
    handle.addEventListener('pointerup', handleUp);
    handle.addEventListener('pointercancel', handleCancel);
  }
</script>

{#if $tutorialActive}
  <div
    bind:this={panelEl}
    class="fixed z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-md border p-4 shadow-lg"
    style="{pos
      ? `left: ${pos.x}px; top: ${pos.y}px;`
      : 'right: 1rem; bottom: 1rem;'} border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <span
          role="button"
          tabindex="-1"
          class="cursor-grab touch-none leading-none select-none active:cursor-grabbing"
          style="color: var(--color-text-secondary);"
          title={$t('tutorial.dragToMove')}
          aria-label={$t('tutorial.dragToMove')}
          onpointerdown={handleDragHandlePointerDown}
        >
          ⠿
        </span>
        <span class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">
          {$t('tutorial.stepOf', { index: $tutorialStepIndex + 1, total: steps.length })}
        </span>
      </div>
      <button
        type="button"
        class="text-xs hover:opacity-70"
        style="color: var(--color-text-secondary);"
        onclick={closeTutorial}
      >
        {$t('tutorial.skip')}
      </button>
    </div>

    <h3 class="text-sm font-semibold">{$t(step.titleKey)}</h3>
    <p class="text-sm" style="color: var(--color-text-secondary);">
      {#each parseInlineCode($t(step.bodyKey)) as part, index (index)}
        {#if part.code}<code
            class="rounded px-1 py-0.5 font-mono text-xs"
            style="background: var(--color-editor-bg); color: var(--color-text);">{part.text}</code
          >{:else}{part.text}{/if}
      {/each}
    </p>

    <div class="mt-1 flex justify-between gap-2">
      <button
        type="button"
        class="btn-neutral rounded-md border px-3 py-1.5 text-sm hover:opacity-80 disabled:opacity-40"
        disabled={isFirst}
        onclick={prevTutorialStep}
      >
        {$t('tutorial.back')}
      </button>
      {#if isLast}
        <button type="button" class="btn btn-accent rounded-md border px-3 py-1.5 text-sm font-medium" onclick={closeTutorial}>
          {$t('tutorial.finish')}
        </button>
      {:else}
        <button
          type="button"
          class="btn btn-accent rounded-md border px-3 py-1.5 text-sm font-medium"
          onclick={nextTutorialStep}
        >
          {$t('tutorial.next')}
        </button>
      {/if}
    </div>
  </div>
{/if}
