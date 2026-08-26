<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import FullscreenToggle from './FullscreenToggle.svelte';
  import HelpModal from './HelpModal.svelte';
  import ProjectMenu from './ProjectMenu.svelte';
  import CanvasMenu from './CanvasMenu.svelte';
  import PreferencesMenu from './PreferencesMenu.svelte';
  import { t } from '../../stores/i18n';
  import { projectName, setProjectName, setProjectNameLive } from '../../stores/project';
  import { undo, redo, canUndo, canRedo } from '../../stores/history';

  let helpOpen = $state(false);
</script>

<header
  class="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-3 py-2 sm:px-4"
  style="border-color: var(--color-border); background: var(--color-panel);"
>
  <div class="flex min-w-0 items-center gap-2 font-semibold" style="color: var(--color-text);">
    <span>💻</span>
    <span>KOUDO</span>
    <!-- Dropped below `sm` — the katakana subtitle is decorative, and the
         project name input needs the room more on a narrow screen. -->
    <span class="hidden text-sm font-normal sm:inline" style="color: var(--color-text-secondary);">コウド</span>
    <input
      type="text"
      class="ml-1 w-24 min-w-0 truncate rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-normal hover:border-[var(--color-border)] focus:border-[var(--color-border)] focus:outline-none sm:w-auto sm:max-w-[12rem]"
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

    <button
      type="button"
      class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80"
      onclick={() => (helpOpen = true)}
    >
      {$t('nav.help')}
    </button>
  </nav>

  <div class="flex items-center gap-2">
    <ThemeToggle />
    <FullscreenToggle />
  </div>
</header>

<HelpModal open={helpOpen} onclose={() => (helpOpen = false)} />
