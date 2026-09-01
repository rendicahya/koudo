<script lang="ts">
  import { t } from '../../stores/i18n';
  import type { TranslationKey } from '../../lib/i18n/translations';
  import {
    isDark,
    themePreference,
    setThemePreference,
    LIGHT_THEMES,
    DARK_THEMES,
    THEME_SWATCHES,
    type ThemeId,
  } from '../../stores/theme';

  // Each id is "light-<flavor>"/"dark-<flavor>" (see stores/theme.ts) — the
  // flavor half picks the label, since light/dark share the same four names.
  const FLAVOR_LABEL_KEYS: Record<string, TranslationKey> = {
    default: 'nav.theme.default',
    warm: 'nav.theme.warm',
    cool: 'nav.theme.cool',
    nature: 'nav.theme.nature',
  };
  function flavorLabelKey(id: ThemeId): TranslationKey {
    return FLAVOR_LABEL_KEYS[id.split('-')[1]];
  }

  let open = $state(false);
  let menuEl: HTMLDivElement;

  function handleWindowClick(event: MouseEvent) {
    if (open && menuEl && !menuEl.contains(event.target as globalThis.Node)) {
      open = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="relative" bind:this={menuEl}>
  <button
    type="button"
    class="rounded-md border px-3 py-1.5 text-sm"
    style="border-color: var(--color-border); color: var(--color-text);"
    aria-haspopup="menu"
    aria-expanded={open}
    title={$t('toggle.themeTitle')}
    onclick={() => (open = !open)}
  >
    {$isDark ? '🌙' : '☀️'}
  </button>
  {#if open}
    <div
      role="menu"
      class="absolute left-0 top-full z-20 mt-1 flex w-60 max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-md border text-sm shadow-md md:left-auto md:right-0"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
    >
      <div class="px-3 pt-2 pb-1 text-xs font-semibold" style="color: var(--color-text-secondary);">
        {$t('nav.themeHeading')}
      </div>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={$themePreference === 'system'}
        class="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
        onclick={() => {
          open = false;
          setThemePreference('system');
        }}
      >
        <span>{$t('nav.themeSystem')}</span>
        {#if $themePreference === 'system'}
          <span style="color: var(--color-accent);">✓</span>
        {/if}
      </button>

      <div class="flex gap-4 px-3 pt-1 pb-2">
        {#each [{ heading: 'nav.themeGroupLight' as TranslationKey, ids: LIGHT_THEMES }, { heading: 'nav.themeGroupDark' as TranslationKey, ids: DARK_THEMES }] as group (group.heading)}
          <div class="flex flex-1 flex-col gap-1">
            <span class="text-[0.7rem]" style="color: var(--color-text-secondary);">{$t(group.heading)}</span>
            {#each group.ids as id (id)}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={$themePreference === id}
                title={$t(flavorLabelKey(id))}
                class="flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs hover:opacity-80"
                style="outline: {$themePreference === id
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)'};"
                onclick={() => {
                  open = false;
                  setThemePreference(id);
                }}
              >
                <span
                  class="inline-block h-3 w-3 shrink-0 rounded-full border"
                  style="background: {THEME_SWATCHES[id].bg}; border-color: {THEME_SWATCHES[id].accent};"
                ></span>
                <span class="truncate">{$t(flavorLabelKey(id))}</span>
              </button>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
