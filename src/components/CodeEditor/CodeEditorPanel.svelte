<script lang="ts">
  import JavaCodeEditor from './JavaCodeEditor.svelte';
  import PseudocodeView from './PseudocodeView.svelte';
  import {
    activeCodeTab,
    type CodeTab,
    codeFontSize,
    zoomCodeFontSize,
    MIN_CODE_FONT_SIZE,
    MAX_CODE_FONT_SIZE,
    codeIndentStyle,
  } from '../../stores/layout';
  import { t } from '../../stores/i18n';
  import { codeContent } from '../../stores/code';
  import { nodes, edges } from '../../stores/flowchart';
  import { generatePseudocode } from '../../lib/flowchart/generatorPseudocode';
  import { wrapAsJavaFile, sanitizeJavaClassName } from '../../lib/flowchart/exportJava';
  import { reindent } from '../../lib/codeIndent';
  import { projectName } from '../../stores/project';
  import { showToast } from '../../stores/toast';

  const TABS: CodeTab[] = ['Pseudocode', 'Java'];

  let javaEditorRef: ReturnType<typeof JavaCodeEditor> | undefined;

  $effect(() => {
    if ($activeCodeTab === 'Java') javaEditorRef?.refreshLayout();
  });

  // Same source each tab already renders from — Java wrapped into a full,
  // compilable file the same way JavaCodeEditor displays it (class name from
  // the project name), Pseudocode derived fresh off the flowchart (see
  // PseudocodeView.svelte), both reindented to match — so Copy always
  // matches what's currently on screen.
  let currentTabCode = $derived(
    reindent(
      $activeCodeTab === 'Java'
        ? wrapAsJavaFile($codeContent, sanitizeJavaClassName($projectName))
        : generatePseudocode($nodes, $edges),
      $codeIndentStyle,
    ),
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentTabCode);
      showToast($t('code.copied'), 2000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : $t('code.copyFailed'));
    }
  }
</script>

<div class="flex h-full w-full flex-col">
  <div
    role="tablist"
    class="flex shrink-0 items-center justify-between border-b"
    style="border-color: var(--color-border); background: var(--color-panel);"
  >
    <div class="flex">
      {#each TABS as tab (tab)}
        <button
          type="button"
          role="tab"
          aria-selected={$activeCodeTab === tab}
          class="border-b-2 px-4 py-1.5 text-sm font-medium"
          style="border-color: {$activeCodeTab === tab
            ? 'var(--color-accent)'
            : 'transparent'}; color: {$activeCodeTab === tab ? 'var(--color-text)' : 'var(--color-text-secondary)'};"
          onclick={() => ($activeCodeTab = tab)}
        >
          {tab === 'Java' ? $t('code.javaTab') : $t('code.pseudocodeTab')}
        </button>
      {/each}
    </div>

    <div class="mr-2 flex items-center gap-2 text-xs" style="color: var(--color-text-secondary);">
      <button
        type="button"
        class="rounded border px-1.5 py-0.5 leading-none hover:opacity-70"
        style="border-color: var(--color-border);"
        title={$t('code.copy')}
        aria-label={$t('code.copy')}
        onclick={handleCopy}
      >
        📋
      </button>

      <!-- Shared zoom for both tabs (see stores/layout.ts's codeFontSize) —
           one control instead of each tab needing its own, since a beginner
           adjusting text size cares about readability generally, not just
           whichever tab happens to be open right now. -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded border px-1.5 py-0.5 leading-none hover:opacity-70 disabled:opacity-40"
          style="border-color: var(--color-border);"
          disabled={$codeFontSize <= MIN_CODE_FONT_SIZE}
          title={$t('code.decreaseTextSize')}
          aria-label={$t('code.decreaseTextSize')}
          onclick={() => zoomCodeFontSize(-1)}
        >
          −
        </button>
        <span class="w-8 text-center tabular-nums">{$codeFontSize}px</span>
        <button
          type="button"
          class="rounded border px-1.5 py-0.5 leading-none hover:opacity-70 disabled:opacity-40"
          style="border-color: var(--color-border);"
          disabled={$codeFontSize >= MAX_CODE_FONT_SIZE}
          title={$t('code.increaseTextSize')}
          aria-label={$t('code.increaseTextSize')}
          onclick={() => zoomCodeFontSize(1)}
        >
          +
        </button>
      </div>
    </div>
  </div>

  <!-- Both views stay mounted (just hidden) rather than being torn down on
       tab switch — Monaco is expensive to recreate, and hiding preserves its
       scroll position/cursor when the user switches back. -->
  <div class="min-h-0 flex-1" style="display: {$activeCodeTab === 'Java' ? 'block' : 'none'};">
    <JavaCodeEditor bind:this={javaEditorRef} />
  </div>
  <div class="min-h-0 flex-1 overflow-hidden" style="display: {$activeCodeTab === 'Pseudocode' ? 'block' : 'none'};">
    <PseudocodeView />
  </div>
</div>
