<script lang="ts">
  import { fade } from 'svelte/transition';
  import { toastMessage, dismissToast } from '../../stores/toast';
  import { t } from '../../stores/i18n';
</script>

{#if $toastMessage}
  <div
    role="status"
    transition:fade={{ duration: 150 }}
    class="fixed bottom-6 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-start gap-2 rounded-md border px-4 py-2.5 text-sm shadow-md"
    style="border-color: var(--color-warning); background: var(--color-panel); color: var(--color-text);"
  >
    <span style="color: var(--color-warning);">⚠</span>
    <span class="flex-1">{$toastMessage}</span>
    <button
      type="button"
      class="leading-none hover:opacity-70"
      style="color: var(--color-text-secondary);"
      title={$t('toast.dismiss')}
      onclick={dismissToast}
    >
      ×
    </button>
  </div>
{/if}
