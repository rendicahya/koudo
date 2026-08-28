<script lang="ts">
  import { t } from '../../../stores/i18n';
  import type { TranslationKey } from '../../../lib/i18n/translations';

  const shortcutKeys: { keys: string; actionKey: TranslationKey }[] = [
    { keys: 'Alt+Shift+R', actionKey: 'help.shortcuts.run' },
    { keys: 'Alt+Shift+S', actionKey: 'help.shortcuts.step' },
    { keys: 'Alt+Shift+A', actionKey: 'help.shortcuts.arrange' },
    { keys: 'Alt+Shift+T', actionKey: 'help.shortcuts.theme' },
    { keys: 'Ctrl+Z', actionKey: 'help.shortcuts.undo' },
    { keys: 'Ctrl+Shift+Z', actionKey: 'help.shortcuts.redo' },
  ];
</script>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.gettingStarted.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.gettingStarted.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.running.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.running.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.codePanel.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.codePanel.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.variableModes.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.variableModes.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.menus.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.menus.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.shortcuts.heading')}</h3>
  <table class="w-full text-left">
    <tbody>
      {#each shortcutKeys as row (row.keys)}
        <tr style="border-top: 1px solid var(--color-border);">
          <td class="py-1 pr-3 font-mono" style="color: var(--color-accent);">{row.keys}</td>
          <td class="py-1">{$t(row.actionKey)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<section>
  <h3 class="mb-1 font-semibold">{$t('help.tips.heading')}</h3>
  <ul class="list-disc pl-5" style="color: var(--color-text-secondary);">
    <li>{$t('help.tips.merge')}</li>
    <li>{$t('help.tips.rightClick')}</li>
    <li>{$t('help.tips.fullscreen')}</li>
    <li>{$t('help.tips.browserOnly')}</li>
    <li>{$t('help.tips.autosave')}</li>
    <li>{$t('help.tips.constAndReorder')}</li>
    <li>{$t('help.tips.tutorial')}</li>
  </ul>
</section>
