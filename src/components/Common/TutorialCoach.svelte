<script lang="ts">
  import { t } from '../../stores/i18n';
  import {
    tutorialActive,
    tutorialStepIndex,
    TUTORIAL_STEPS,
    STEP_CONTENT_KEYS,
    STEP_HIGHLIGHT,
    nextTutorialStep,
    prevTutorialStep,
    closeTutorial,
  } from '../../stores/tutorial';

  let stepId = $derived(TUTORIAL_STEPS[$tutorialStepIndex]);
  let content = $derived(STEP_CONTENT_KEYS[stepId]);
  let isFirst = $derived($tutorialStepIndex === 0);
  let isLast = $derived($tutorialStepIndex === TUTORIAL_STEPS.length - 1);

  // Draws attention to whichever palette chip/button this step calls for
  // (see STEP_HIGHLIGHT) by toggling a CSS class on it — re-run on every
  // step change, cleaning up the previous step's highlight first.
  $effect(() => {
    const selector = $tutorialActive ? STEP_HIGHLIGHT[stepId] : undefined;
    const el = selector ? document.querySelector(selector) : null;
    el?.classList.add('tutorial-highlight');
    return () => el?.classList.remove('tutorial-highlight');
  });
</script>

{#if $tutorialActive}
  <div
    class="fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-md border p-4 shadow-lg"
    style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">
        {$t('tutorial.stepOf', { index: $tutorialStepIndex + 1, total: TUTORIAL_STEPS.length })}
      </span>
      <button
        type="button"
        class="text-xs hover:opacity-70"
        style="color: var(--color-text-secondary);"
        onclick={closeTutorial}
      >
        {$t('tutorial.skip')}
      </button>
    </div>

    <h3 class="text-sm font-semibold">{$t(content.titleKey)}</h3>
    <p class="text-sm" style="color: var(--color-text-secondary);">{$t(content.bodyKey)}</p>

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
