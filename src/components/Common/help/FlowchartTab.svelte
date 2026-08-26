<script lang="ts">
  import { t } from '../../../stores/i18n';
  import type { TranslationKey } from '../../../lib/i18n/translations';

  const symbols: { symbol: string; nameKey: TranslationKey; descKey: TranslationKey }[] = [
    { symbol: '⬭', nameKey: 'help.flowchartTutorial.symbol.terminal.name', descKey: 'help.flowchartTutorial.symbol.terminal.desc' },
    { symbol: '▭', nameKey: 'help.flowchartTutorial.symbol.process.name', descKey: 'help.flowchartTutorial.symbol.process.desc' },
    {
      symbol: '▱',
      nameKey: 'help.flowchartTutorial.symbol.inputOutput.name',
      descKey: 'help.flowchartTutorial.symbol.inputOutput.desc',
    },
    { symbol: '◇', nameKey: 'help.flowchartTutorial.symbol.decision.name', descKey: 'help.flowchartTutorial.symbol.decision.desc' },
    { symbol: '⬡', nameKey: 'help.flowchartTutorial.symbol.loop.name', descKey: 'help.flowchartTutorial.symbol.loop.desc' },
    { symbol: '→', nameKey: 'help.flowchartTutorial.symbol.arrow.name', descKey: 'help.flowchartTutorial.symbol.arrow.desc' },
  ];
</script>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.flowchartTutorial.intro.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.flowchartTutorial.intro.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-2 font-semibold">{$t('help.flowchartTutorial.symbols.heading')}</h3>
  <ul class="flex flex-col gap-1.5">
    {#each symbols as item (item.nameKey)}
      <li class="flex gap-2">
        <span class="w-5 shrink-0 text-center" style="color: var(--color-accent);">{item.symbol}</span>
        <span
          ><strong>{$t(item.nameKey)}</strong> — <span style="color: var(--color-text-secondary);"
            >{$t(item.descKey)}</span
          ></span
        >
      </li>
    {/each}
  </ul>
</section>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.flowchartTutorial.reading.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.flowchartTutorial.reading.body')}
  </p>
</section>

<section>
  <h3 class="mb-1 font-semibold">{$t('help.flowchartTutorial.example.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.flowchartTutorial.example.body')}
  </p>
</section>
