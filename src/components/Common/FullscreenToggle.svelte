<script lang="ts">
  // No store needed (unlike theme/variableMode) — fullscreen isn't a
  // preference worth persisting across reloads, and the browser itself
  // already drops it on refresh/navigation. document.fullscreenElement is
  // the single source of truth; this just mirrors it into local state so
  // the button's own label/icon can react to fullscreen being toggled some
  // other way too (e.g. the browser's own Esc-to-exit).
  let isFullscreen = $state(!!document.fullscreenElement);

  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Can reject (e.g. a permissions-policy restriction) — not worth
      // surfacing to the user beyond the console; the button just stays in
      // its current state either way, no different from the click failing
      // to register at all.
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
  }
</script>

<svelte:document onfullscreenchange={handleFullscreenChange} />

<button
  type="button"
  onclick={toggleFullscreen}
  class="rounded-md border px-3 py-1.5 text-sm"
  style="border-color: var(--color-border); color: var(--color-text);"
  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
>
  {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
</button>
