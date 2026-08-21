<script lang="ts">
  import { useSvelteFlow } from '@xyflow/svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import FullscreenToggle from './FullscreenToggle.svelte';
  import HelpModal from './HelpModal.svelte';
  import { codeContent } from '../../stores/code';
  import { resetFlowchart, loadFlowchart, arrangeNodesVertically, nodes, edges } from '../../stores/flowchart';
  import { downloadTextFile, downloadDataUrl, sanitizeFilename } from '../../lib/download';
  import { serializeFlowchart, parseFlowchartFile } from '../../lib/storage/flowchartFile';
  import { wrapAsJavaFile } from '../../lib/flowchart/exportJava';
  import { generatePseudocode } from '../../lib/flowchart/generatorPseudocode';
  import { flowchartToPngDataUrl } from '../../lib/flowchart/exportPng';
  import { stopStepRun } from '../../stores/stepRunner';
  import { variableMode, setVariableMode, type VariableMode } from '../../stores/settings';
  import { t, language, setLanguage, type Language } from '../../stores/i18n';
  import { projectName, setProjectName, DEFAULT_PROJECT_NAME } from '../../stores/project';
  import type { TranslationKey } from '../../lib/i18n/translations';

  // New/Open/Save all act on the same thing — the flowchart project — so
  // they live under one "Project" menu; Export Java joins them there too,
  // even though it produces something different (a Java source file, not a
  // project), since it's still a whole-project action rather than a
  // canvas-editing one. Ids (not the displayed label) drive the switch in
  // handleProjectAction below, so the label can be translated without
  // touching the dispatch logic.
  type ProjectAction = 'new' | 'open' | 'save' | 'exportJava' | 'exportPseudocode';
  const PROJECT_ACTIONS: { id: ProjectAction; labelKey: TranslationKey }[] = [
    { id: 'new', labelKey: 'nav.new' },
    { id: 'open', labelKey: 'nav.open' },
    { id: 'save', labelKey: 'nav.save' },
    { id: 'exportJava', labelKey: 'nav.exportJava' },
    { id: 'exportPseudocode', labelKey: 'nav.exportPseudocode' },
  ];
  // Arrange/PNG both act on the canvas as a whole (not any one block), so
  // they get their own menu rather than crowding the toolbar as standalone
  // buttons.
  type CanvasAction = 'arrange' | 'downloadPng';
  const CANVAS_ACTIONS: { id: CanvasAction; labelKey: TranslationKey; titleKey: TranslationKey }[] = [
    { id: 'arrange', labelKey: 'nav.arrange', titleKey: 'nav.arrangeTitle' },
    { id: 'downloadPng', labelKey: 'nav.downloadPng', titleKey: 'nav.downloadPngTitle' },
  ];
  // Also lives in the Project menu, as a second group below the actions
  // above — it's a project-wide setting (persisted, see stores/settings.ts),
  // not a one-off action, but there's no other menu it fits better than this
  // one.
  const variableModeOptions: { mode: VariableMode; labelKey: TranslationKey; hintKey: TranslationKey }[] = [
    { mode: 'inferred', labelKey: 'nav.variableModeBeginner', hintKey: 'nav.variableModeBeginnerHint' },
    { mode: 'explicit', labelKey: 'nav.variableModeStandard', hintKey: 'nav.variableModeStandardHint' },
  ];
  // A third group, same menu, same reasoning as variableModeOptions above.
  // Native names (not translated) — a language picker conventionally shows
  // each option in its own language, not the currently active one.
  const languageOptions: { lang: Language; label: string }[] = [
    { lang: 'en', label: 'English' },
    { lang: 'id', label: 'Bahasa Indonesia' },
  ];

  let projectMenuOpen = $state(false);
  let projectMenuEl: HTMLDivElement;
  let canvasMenuOpen = $state(false);
  let canvasMenuEl: HTMLDivElement;
  let preferencesMenuOpen = $state(false);
  let preferencesMenuEl: HTMLDivElement;
  let helpOpen = $state(false);
  let fileInputEl: HTMLInputElement;

  // Only used by Download PNG — see useSvelteFlow requiring this component to
  // sit inside a SvelteFlowProvider (hoisted up to App.svelte for exactly
  // this reason, since TopNavbar and FlowchartCanvas are siblings there).
  const { getNodesBounds } = useSvelteFlow();

  function handleNew() {
    if (!confirm($t('nav.confirmNew'))) return;
    stopStepRun();
    resetFlowchart();
    setProjectName(DEFAULT_PROJECT_NAME);
  }

  function handleSave() {
    downloadTextFile(
      `${sanitizeFilename($projectName)}.koudo.json`,
      serializeFlowchart($nodes, $edges, $projectName),
      'application/json',
    );
  }

  // Java's public-class-name-must-match-filename rule means this can't
  // follow the project name the way Save/Export Pseudocode/Download PNG
  // do — the generated class is always `Main` (see exportJava.ts), so the
  // file stays Main.java regardless of what the project is called.
  function handleExport() {
    downloadTextFile('Main.java', wrapAsJavaFile($codeContent), 'text/x-java-source');
  }

  function handleExportPseudocode() {
    downloadTextFile(`${sanitizeFilename($projectName)}.pseudocode.txt`, generatePseudocode($nodes, $edges), 'text/plain');
  }

  function handleArrange() {
    $nodes = arrangeNodesVertically($nodes, $edges);
  }

  // The visible canvas background (--color-canvas) rather than the page/panel
  // background — a transparent PNG would otherwise show whatever's behind
  // it in a viewer instead of matching what the user actually saw on screen.
  // Queried off document.documentElement/a global selector rather than a
  // bound ref, since there's only ever one canvas on the page and neither is
  // reachable from here otherwise (TopNavbar sits outside FlowchartBoard).
  async function handleDownloadPng() {
    const viewportEl = document.querySelector<HTMLElement>('.svelte-flow__viewport');
    if (!viewportEl) return;

    try {
      const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas').trim();
      const dataUrl = await flowchartToPngDataUrl(viewportEl, $nodes, backgroundColor, getNodesBounds);
      downloadDataUrl(`${sanitizeFilename($projectName)}.png`, dataUrl);
    } catch (err) {
      // html-to-image's toPng() rejects (rather than resolving to a broken
      // image) on things like a cross-origin/tainted canvas — surface it
      // instead of failing the click silently, same as Open/Save Project's
      // own error handling.
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleOpen() {
    if (!confirm($t('nav.confirmOpen'))) return;
    fileInputEl.click();
  }

  // The file input's own onchange — separate from handleOpen since it can
  // also fire from a file picked after handleOpen's confirm, asynchronously.
  async function handleFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // otherwise re-picking the same file wouldn't fire another change event

    if (!file) return;
    try {
      const project = parseFlowchartFile(await file.text());
      stopStepRun();
      loadFlowchart(project.nodes, project.edges);
      setProjectName(project.name ?? DEFAULT_PROJECT_NAME);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleProjectAction(action: ProjectAction) {
    projectMenuOpen = false;
    if (action === 'new') return handleNew();
    if (action === 'open') return handleOpen();
    if (action === 'save') return handleSave();
    if (action === 'exportJava') return handleExport();
    if (action === 'exportPseudocode') return handleExportPseudocode();
  }

  function handleCanvasAction(action: CanvasAction) {
    canvasMenuOpen = false;
    if (action === 'arrange') return handleArrange();
    if (action === 'downloadPng') return handleDownloadPng();
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      projectMenuOpen = false;
      canvasMenuOpen = false;
      preferencesMenuOpen = false;
      helpOpen = false;
    }
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;

    // Alt+Shift+<letter>, matching the pattern already used for the theme
    // toggle — avoids Ctrl combos, which Monaco and the browser both claim
    // heavily. Run/Step's own Alt+Shift+R/S live with their buttons now (see
    // OutputPanel.svelte).
    const key = event.key.toLowerCase();
    if (key === 'a') {
      event.preventDefault();
      handleArrange();
    }
  }

  function handleWindowClick(event: MouseEvent) {
    if (projectMenuOpen && projectMenuEl && !projectMenuEl.contains(event.target as globalThis.Node)) {
      projectMenuOpen = false;
    }
    if (canvasMenuOpen && canvasMenuEl && !canvasMenuEl.contains(event.target as globalThis.Node)) {
      canvasMenuOpen = false;
    }
    if (
      preferencesMenuOpen &&
      preferencesMenuEl &&
      !preferencesMenuEl.contains(event.target as globalThis.Node)
    ) {
      preferencesMenuOpen = false;
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} onclick={handleWindowClick} />

<header
  class="flex items-center justify-between border-b px-4 py-2"
  style="border-color: var(--color-border); background: var(--color-panel);"
>
  <div class="flex items-center gap-2 font-semibold" style="color: var(--color-text);">
    <span>💻</span>
    <span>KOUDO</span>
    <span class="text-sm font-normal" style="color: var(--color-text-secondary);">コウド</span>
    <input
      type="text"
      class="ml-1 max-w-[12rem] truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-normal hover:border-[var(--color-border)] focus:border-[var(--color-border)] focus:outline-none"
      style="color: var(--color-text-secondary);"
      aria-label={$t('nav.projectNameLabel')}
      title={$t('nav.projectNameLabel')}
      value={$projectName}
      onblur={(event) => setProjectName(event.currentTarget.value)}
      onkeydown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
    />
  </div>

  <div class="flex items-center gap-2">
    <nav class="flex items-center gap-2">
      <div class="relative" bind:this={projectMenuEl}>
        <button
          type="button"
          class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          aria-haspopup="menu"
          aria-expanded={projectMenuOpen}
          onclick={() => (projectMenuOpen = !projectMenuOpen)}
        >
          {$t('nav.project')} ▾
        </button>
        {#if projectMenuOpen}
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col overflow-hidden rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each PROJECT_ACTIONS as action (action.id)}
              <button
                type="button"
                role="menuitem"
                class="px-3 py-1.5 text-left hover:opacity-80"
                onclick={() => handleProjectAction(action.id)}
              >
                {$t(action.labelKey)}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="relative" bind:this={canvasMenuEl}>
        <button
          type="button"
          class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          aria-haspopup="menu"
          aria-expanded={canvasMenuOpen}
          onclick={() => (canvasMenuOpen = !canvasMenuOpen)}
        >
          {$t('nav.canvas')} ▾
        </button>
        {#if canvasMenuOpen}
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-1 flex w-44 flex-col overflow-hidden rounded-md border text-sm shadow-md"
            style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
          >
            {#each CANVAS_ACTIONS as action (action.id)}
              <button
                type="button"
                role="menuitem"
                class="px-3 py-1.5 text-left hover:opacity-80"
                title={$t(action.titleKey)}
                onclick={() => handleCanvasAction(action.id)}
              >
                {$t(action.labelKey)}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="relative" bind:this={preferencesMenuEl}>
        <button
          type="button"
          class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
          aria-haspopup="menu"
          aria-expanded={preferencesMenuOpen}
          onclick={() => (preferencesMenuOpen = !preferencesMenuOpen)}
        >
          {$t('nav.preferences')} ▾
        </button>
        {#if preferencesMenuOpen}
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-1 flex w-52 flex-col overflow-hidden rounded-md border text-sm shadow-md"
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
                  preferencesMenuOpen = false;
                  setVariableMode(option.mode);
                }}
              >
                <span>{$t(option.labelKey)}</span>
                {#if $variableMode === option.mode}
                  <span style="color: var(--color-accent);">✓</span>
                {/if}
              </button>
            {/each}

            <div class="border-t" style="border-color: var(--color-border);"></div>

            {#each languageOptions as option (option.lang)}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={$language === option.lang}
                class="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:opacity-80"
                onclick={() => {
                  preferencesMenuOpen = false;
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

      <button
        type="button"
        class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
        onclick={() => (helpOpen = true)}
      >
        {$t('nav.help')}
      </button>
    </nav>

    <input
      bind:this={fileInputEl}
      type="file"
      accept=".json,application/json"
      class="hidden"
      onchange={handleFileSelected}
    />
  </div>

  <div class="flex items-center gap-2">
    <ThemeToggle />
    <FullscreenToggle />
  </div>
</header>

<HelpModal open={helpOpen} onclose={() => (helpOpen = false)} />
