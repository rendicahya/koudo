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

  // Mobile-only "Menu" dropdown — below md, ProjectMenu/CanvasMenu/
  // PreferencesMenu/HelpMenu (plus Undo/Redo) collapse into this one button
  // instead of crowding the header as separate ones; at md+ the .nav-menu
  // CSS below reverts them to the exact same inline row as before, so this
  // state is simply inert on desktop. The wrapping div only needs to exist
  // for its position:relative + click-outside anchor on mobile — md:contents
  // makes it disappear from the desktop layout so it doesn't add an extra
  // flex level around the nav's own children there.
  let mobileMenuOpen = $state(false);
  let mobileMenuGroupEl: HTMLDivElement;

  function handleMobileMenuWindowClick(event: MouseEvent) {
    if (mobileMenuOpen && mobileMenuGroupEl && !mobileMenuGroupEl.contains(event.target as globalThis.Node)) {
      mobileMenuOpen = false;
    }
  }

  function handleMobileMenuWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') mobileMenuOpen = false;
  }
</script>

<svelte:window onclick={handleMobileMenuWindowClick} onkeydown={handleMobileMenuWindowKeydown} />

<header
  class="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-3 py-2 sm:px-4"
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

  <!-- Below md, ProjectMenu/CanvasMenu/PreferencesMenu/HelpMenu (plus
       Undo/Redo) collapse behind one "Menu" button instead of each sitting
       inline — a narrow screen doesn't have room for five separate menu
       buttons. This wrapping div only matters on mobile (position:relative
       anchor for the dropdown, plus the click-outside/Escape target above);
       md:contents removes it from the desktop layout entirely, so the nav
       below sits exactly where it always did, a direct flex child of the
       header. -->
  <div class="relative md:contents" bind:this={mobileMenuGroupEl}>
    <button
      type="button"
      class="btn-ghost rounded-md px-3 py-1.5 text-sm hover:opacity-80 md:hidden"
      aria-haspopup="menu"
      aria-expanded={mobileMenuOpen}
      onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
    >
      {$t('nav.menu')} ▾
    </button>

    <!-- flex-1 (at md+) so this claims whatever room is left on the title's
         own row before wrapping to its own row(s) below — same flex-wrap the
         header itself uses, just scoped to this group of buttons so a narrow
         screen wraps them without also breaking the title row's own layout.
         Below md, nav-menu's own CSS (see <style> below) turns this into the
         "Menu" button's dropdown panel instead. -->
    <nav class="nav-menu {mobileMenuOpen ? 'flex' : 'hidden'} md:flex md:flex-1 md:flex-wrap md:items-center md:gap-2">
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
  </div>

  <div class="flex items-center gap-2">
    <ThemeToggle />
    <FullscreenToggle />
  </div>
</header>

<style>
  /* Mobile: the "Menu" button's dropdown panel — a floating box below the
     button, matching every other menu's own left-0/top-full/shadow-md
     dropdown styling. Only the shown/hidden state is Svelte-driven (see the
     class:flex/hidden above); everything else lives here since it differs
     entirely between mobile and desktop, unlike a simple show/hide toggle.
     At md+, this reverts to the exact plain inline flex row TopNavbar always
     used before mobile menus existed — position:static, no box around it. */
  .nav-menu {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 20;
    margin-top: 0.25rem;
    width: 14rem;
    max-width: calc(100vw - 1.5rem);
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.375rem;
    border: 1px solid var(--color-border);
    background: var(--color-panel);
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
  }

  @media (min-width: 768px) {
    .nav-menu {
      position: static;
      width: auto;
      max-width: none;
      flex-direction: row;
      padding: 0;
      border-radius: 0;
      border: none;
      background: transparent;
      box-shadow: none;
    }
  }
</style>
