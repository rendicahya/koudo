<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import FullscreenToggle from './FullscreenToggle.svelte';
  import HelpModal from './HelpModal.svelte';
  import ProjectMenu from './ProjectMenu.svelte';
  import CanvasMenu from './CanvasMenu.svelte';
  import PreferencesMenu from './PreferencesMenu.svelte';
  import { t } from '../../stores/i18n';
  import { projectName, setProjectName, setProjectNameLive } from '../../stores/project';

  let helpOpen = $state(false);
</script>

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
      oninput={(event) => setProjectNameLive(event.currentTarget.value)}
      onblur={(event) => setProjectName(event.currentTarget.value)}
      onkeydown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
    />
  </div>

  <div class="flex items-center gap-2">
    <nav class="flex items-center gap-2">
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
  </div>

  <div class="flex items-center gap-2">
    <ThemeToggle />
    <FullscreenToggle />
  </div>
</header>

<HelpModal open={helpOpen} onclose={() => (helpOpen = false)} />
