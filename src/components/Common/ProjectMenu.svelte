<script lang="ts">
  import { resetFlowchart, loadFlowchart, nodes, edges } from '../../stores/flowchart';
  import { downloadTextFile, sanitizeFilename } from '../../lib/download';
  import { serializeFlowchart, parseFlowchartFile } from '../../lib/storage/flowchartFile';
  import { wrapAsJavaFile, sanitizeJavaClassName } from '../../lib/flowchart/exportJava';
  import { generatePseudocode } from '../../lib/flowchart/generatorPseudocode';
  import { reindent } from '../../lib/codeIndent';
  import { codeIndentStyle } from '../../stores/layout';
  import { stopStepRun } from '../../stores/stepRunner';
  import { t } from '../../stores/i18n';
  import { codeContent } from '../../stores/code';
  import { projectName, setProjectName, DEFAULT_PROJECT_NAME } from '../../stores/project';
  import type { TranslationKey } from '../../lib/i18n/translations';

  // New/Open/Save all act on the same thing — the flowchart project — so
  // they live under one "Project" menu; Export Java joins them there too,
  // even though it produces something different (a Java source file, not a
  // project), since it's still a whole-project action rather than a
  // canvas-editing one. Ids (not the displayed label) drive the switch in
  // handleAction below, so the label can be translated without touching the
  // dispatch logic.
  type ProjectAction = 'new' | 'open' | 'save' | 'exportJava' | 'exportPseudocode';
  const PROJECT_ACTIONS: { id: ProjectAction; labelKey: TranslationKey }[] = [
    { id: 'new', labelKey: 'nav.new' },
    { id: 'open', labelKey: 'nav.open' },
    { id: 'save', labelKey: 'nav.save' },
    { id: 'exportJava', labelKey: 'nav.exportJava' },
    { id: 'exportPseudocode', labelKey: 'nav.exportPseudocode' },
  ];

  let open = $state(false);
  let menuEl: HTMLDivElement;
  let fileInputEl: HTMLInputElement;

  function handleNew() {
    if (!confirm($t('nav.confirmNew'))) return;
    stopStepRun();
    resetFlowchart();
    setProjectName(DEFAULT_PROJECT_NAME);
  }

  function handleSave() {
    downloadTextFile(
      `${sanitizeFilename($projectName)}.kdo`,
      serializeFlowchart($nodes, $edges, $projectName),
      'application/json',
    );
  }

  // Java's public-class-name-must-match-filename rule means the class name
  // (see sanitizeJavaClassName) and the filename have to agree, so both are
  // derived from the project name together here.
  function handleExportJava() {
    const className = sanitizeJavaClassName($projectName);
    downloadTextFile(`${className}.java`, reindent(wrapAsJavaFile($codeContent, className), $codeIndentStyle), 'text/x-java-source');
  }

  function handleExportPseudocode() {
    downloadTextFile(
      `${sanitizeFilename($projectName)}.pseudocode.txt`,
      reindent(generatePseudocode($nodes, $edges), $codeIndentStyle),
      'text/plain',
    );
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

  function handleAction(action: ProjectAction) {
    open = false;
    if (action === 'new') return handleNew();
    if (action === 'open') return handleOpen();
    if (action === 'save') return handleSave();
    if (action === 'exportJava') return handleExportJava();
    if (action === 'exportPseudocode') return handleExportPseudocode();
  }

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
    class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {$t('nav.project')} ▾
  </button>
  {#if open}
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
          onclick={() => handleAction(action.id)}
        >
          {$t(action.labelKey)}
        </button>
      {/each}
    </div>
  {/if}
</div>

<input bind:this={fileInputEl} type="file" accept=".kdo,.json,application/json" class="hidden" onchange={handleFileSelected} />
