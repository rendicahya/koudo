<script lang="ts">
  import { theme, toggleTheme } from '../../stores/theme';
</script>

<button
  type="button"
  onclick={toggleTheme}
  class="rounded-md border px-3 py-1.5 text-sm"
  style="border-color: var(--color-border); color: var(--color-text);"
  aria-label="Toggle dark/light mode"
>
  {$theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
</button>
