<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import FullscreenToggle from './FullscreenToggle.svelte';
  import ProjectMenu from './ProjectMenu.svelte';
  import CanvasMenu from './CanvasMenu.svelte';
  import PreferencesMenu from './PreferencesMenu.svelte';
  import HelpMenu from './HelpMenu.svelte';
  import { t } from '../../stores/i18n';
  import { projectName, setProjectName, setProjectNameLive } from '../../stores/project';
  import { undo, redo, canUndo, canRedo } from '../../stores/history';
</script>

<header
  class="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-4 py-2"
  style="border-color: var(--color-border); background: var(--color-panel);"
>
  <div class="flex min-w-0 items-center gap-2 font-semibold" style="color: var(--color-text);">
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" class="shrink-0">
      <g fill="none" stroke="#b3331c" stroke-width="3" stroke-linecap="round">
        <path d="M17 8c0 2-3 2-3 4.5s3 2.5 3 5" />
        <path d="M24 8c0 2-3 2-3 4.5s3 2.5 3 5" />
        <path d="M31 8c0 2-3 2-3 4.5s3 2.5 3 5" />
      </g>
      <path d="M12 20h20v10a10 10 0 0 1-20 0V20Z" fill="#b3331c" />
      <path d="M32 22a6 6 0 0 1 0 12" fill="none" stroke="#b3331c" stroke-width="3" stroke-linecap="round" />
      <ellipse cx="22" cy="41" rx="13" ry="2.5" fill="#b3331c" />
    </svg>
    <span>KOUDO</span>
    <span class="text-sm font-normal" style="color: var(--color-text-secondary);">コウド</span>
    <input
      type="text"
      class="ml-1 w-auto max-w-[12rem] min-w-0 truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-normal hover:border-[var(--color-border)] focus:border-[var(--color-border)] focus:outline-none"
      style="color: var(--color-text-secondary);"
      aria-label={$t('nav.projectNameLabel')}
      title={$t('nav.projectNameLabel')}
      value={$projectName}
      oninput={(event) => setProjectNameLive(event.currentTarget.value)}
      onblur={(event) => setProjectName(event.currentTarget.value)}
      onkeydown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
    />
  </div>

  <!-- flex-1 so this claims whatever room is left on the title's own row
       before wrapping to its own row(s) below — same flex-wrap the header
       itself uses, just scoped to this group of buttons so a narrow screen
       wraps them without also breaking the title row's own layout. -->
  <nav class="flex flex-1 flex-wrap items-center gap-2">
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="btn-ghost rounded-md px-2 py-1.5 text-sm hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!$canUndo}
        title={$t('nav.undoTitle')}
        aria-label={$t('nav.undo')}
        onclick={() => undo()}
      >
        ↶
      </button>
      <button
        type="button"
        class="btn-ghost rounded-md px-2 py-1.5 text-sm hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!$canRedo}
        title={$t('nav.redoTitle')}
        aria-label={$t('nav.redo')}
        onclick={() => redo()}
      >
        ↷
      </button>
    </div>

    <ProjectMenu />
    <CanvasMenu />
    <PreferencesMenu />
    <HelpMenu />
  </nav>

  <div class="flex items-center gap-2">
    <ThemeToggle />
    <FullscreenToggle />
  </div>
</header>
