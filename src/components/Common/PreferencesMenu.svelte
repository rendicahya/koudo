<script lang="ts">
  import { variableMode, setVariableMode, type VariableMode } from '../../stores/settings';
  import {
    codeIndentStyle,
    setCodeIndentStyle,
    type CodeIndentStyle,
    codeFontId,
    setCodeFontId,
    CODE_FONT_OPTIONS,
  } from '../../stores/layout';
  import { t, language, setLanguage, type Language } from '../../stores/i18n';
  import type { TranslationKey } from '../../lib/i18n/translations';

  const variableModeOptions: { mode: VariableMode; labelKey: TranslationKey; hintKey: TranslationKey }[] = [
    { mode: 'inferred', labelKey: 'nav.variableModeBeginner', hintKey: 'nav.variableModeBeginnerHint' },
    { mode: 'explicit', labelKey: 'nav.variableModeStandard', hintKey: 'nav.variableModeStandardHint' },
  ];
  // Native names (not translated) — a language picker conventionally shows
  // each option in its own language, not the currently active one.
  const languageOptions: { lang: Language; label: string }[] = [
    { lang: 'en', label: 'English' },
    { lang: 'id', label: 'Bahasa Indonesia' },
  ];
  const codeIndentOptions: { style: CodeIndentStyle; labelKey: TranslationKey }[] = [
    { style: '2', labelKey: 'nav.codeIndent2' },
    { style: '4', labelKey: 'nav.codeIndent4' },
    { style: 'tab', labelKey: 'nav.codeIndentTab' },
  ];

  let open = $state(false);
  // Only one submenu flyout open at a time — closed whenever the top-level
  // menu itself closes (see closeMenu below), same as a native OS menu.
  let activeSubmenu = $state<'mode' | 'language' | 'code' | null>(null);
  let menuEl: HTMLDivElement;

  function closeMenu() {
    open = false;
    activeSubmenu = null;
  }

  function handleWindowClick(event: MouseEvent) {
    if (open && menuEl && !menuEl.contains(event.target as globalThis.Node)) {
      closeMenu();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeMenu();
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="relative" bind:this={menuEl}>
  <button
    type="button"
    class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {$t('nav.preferences')} ▾
  </button>
  {#if open}
    <div
      role="menu"
      class="absolute left-0 top-full z-20 mt-1 flex w-52 max-w-[calc(100vw-1.5rem)] flex-col rounded-md border text-sm shadow-md"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
    >
      <div class="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={activeSubmenu === 'mode'}
          class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
          onclick={() => (activeSubmenu = activeSubmenu === 'mode' ? null : 'mode')}
        >
          <span>{$t('nav.modeHeading')}</span>
          <span style="color: var(--color-text-secondary);">▸</span>
        </button>
        {#if activeSubmenu === 'mode'}
          <div
            role="menu"
            class="absolute left-full top-0 z-20 ml-1 flex w-64 max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each variableModeOptions as option (option.mode)}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={$variableMode === option.mode}
                class="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
                title={$t(option.hintKey)}
                onclick={() => {
                  closeMenu();
                  setVariableMode(option.mode);
                }}
              >
                <span>{$t(option.labelKey)}</span>
                {#if $variableMode === option.mode}
                  <span style="color: var(--color-accent);">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="border-t" style="border-color: var(--color-border);"></div>

      <div class="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={activeSubmenu === 'language'}
          class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
          onclick={() => (activeSubmenu = activeSubmenu === 'language' ? null : 'language')}
        >
          <span>{$t('nav.language')}</span>
          <span style="color: var(--color-text-secondary);">▸</span>
        </button>
        {#if activeSubmenu === 'language'}
          <div
            role="menu"
            class="absolute left-full top-0 z-20 ml-1 flex w-48 max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each languageOptions as option (option.lang)}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={$language === option.lang}
                class="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
                onclick={() => {
                  closeMenu();
                  setLanguage(option.lang);
                }}
              >
                <span>{option.label}</span>
                {#if $language === option.lang}
                  <span style="color: var(--color-accent);">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="border-t" style="border-color: var(--color-border);"></div>

      <div class="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={activeSubmenu === 'code'}
          class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
          onclick={() => (activeSubmenu = activeSubmenu === 'code' ? null : 'code')}
        >
          <span>{$t('nav.codeHeading')}</span>
          <span style="color: var(--color-text-secondary);">▸</span>
        </button>
        {#if activeSubmenu === 'code'}
          <div
            role="menu"
            class="absolute left-full top-0 z-20 ml-1 flex max-h-[80vh] w-60 max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            <div class="px-3 pt-2 pb-1 text-xs font-semibold" style="color: var(--color-text-secondary);">
              {$t('nav.codeIndentHeading')}
            </div>
            {#each codeIndentOptions as option (option.style)}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={$codeIndentStyle === option.style}
                class="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
                onclick={() => {
                  closeMenu();
                  setCodeIndentStyle(option.style);
                }}
              >
                <span>{$t(option.labelKey)}</span>
                {#if $codeIndentStyle === option.style}
                  <span style="color: var(--color-accent);">✓</span>
                {/if}
              </button>
            {/each}

            <div class="flex flex-col gap-1 px-3 pt-2 pb-2">
              <label class="text-xs font-semibold" style="color: var(--color-text-secondary);" for="code-font-select">
                {$t('nav.codeFontHeading')}
              </label>
              <select
                id="code-font-select"
                value={$codeFontId}
                onchange={(event) => setCodeFontId(event.currentTarget.value)}
                class="rounded border bg-transparent px-1.5 py-1 text-sm"
                style="border-color: var(--color-border);"
              >
                {#each CODE_FONT_OPTIONS as font (font.id)}
                  <option value={font.id}>{font.id === 'default' ? $t('nav.codeFontDefault') : font.label}</option>
                {/each}
              </select>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
