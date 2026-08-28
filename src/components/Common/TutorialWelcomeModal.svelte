<script lang="ts">
  import { t, language, setLanguage, type Language } from '../../stores/i18n';
  import { showWelcome, startTutorial, skipTutorial } from '../../stores/tutorial';

  // Native names (not translated) — same reasoning as PreferencesMenu's own
  // language picker.
  const languageOptions: { lang: Language; label: string }[] = [
    { lang: 'en', label: 'English' },
    { lang: 'id', label: 'Bahasa Indonesia' },
  ];
</script>

{#if $showWelcome}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0, 0, 0, 0.5);">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      class="flex w-full max-w-md flex-col gap-4 rounded-md border p-5 shadow-lg"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
    >
      <h2 id="welcome-modal-title" class="text-lg font-semibold">{$t('welcome.title')}</h2>
      <p class="text-sm" style="color: var(--color-text-secondary);">{$t('welcome.body')}</p>

      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold tracking-wide uppercase" style="color: var(--color-text-secondary);">
          {$t('welcome.languageLabel')}
        </span>
        <div class="flex gap-2">
          {#each languageOptions as option (option.lang)}
            <button
              type="button"
              class="flex-1 rounded-md border px-3 py-1.5 text-sm"
              style="border-color: {$language === option.lang
                ? 'var(--color-accent)'
                : 'var(--color-border)'}; color: {$language === option.lang
                ? 'var(--color-accent)'
                : 'var(--color-text)'};"
              onclick={() => setLanguage(option.lang)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="mt-1 flex justify-end gap-2">
        <button type="button" class="btn-neutral rounded-md border px-3 py-1.5 text-sm hover:opacity-80" onclick={skipTutorial}>
          {$t('welcome.skip')}
        </button>
        <button
          type="button"
          class="btn btn-accent rounded-md border px-3 py-1.5 text-sm font-medium"
          onclick={startTutorial}
        >
          {$t('welcome.start')}
        </button>
      </div>
    </div>
  </div>
{/if}
