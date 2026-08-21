<script lang="ts">
  import { theme, toggleTheme } from '../../stores/theme';
  import { t } from '../../stores/i18n';
</script>

<button
  type="button"
  onclick={toggleTheme}
  class="rounded-md border px-3 py-1.5 text-sm"
  style="border-color: var(--color-border); color: var(--color-text);"
  aria-label={$t('toggle.themeTitle')}
  title={$t('toggle.themeTitle')}
>
  {$theme === 'dark' ? '🌙' : '☀️'}
</button>
