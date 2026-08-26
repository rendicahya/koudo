<script lang="ts">
  import { t } from '../../../stores/i18n';
  import type { TranslationKey } from '../../../lib/i18n/translations';

  // Keyword text itself isn't translated (matches generatorPseudocode.ts's
  // fixed, English-only output) — only the explanation of what it does is.
  const keywords: { keyword: string; descKey: TranslationKey }[] = [
    { keyword: 'START / END', descKey: 'help.pseudocodeTutorial.keyword.startEnd.desc' },
    { keyword: 'DECLARE x AS TYPE', descKey: 'help.pseudocodeTutorial.keyword.declare.desc' },
    { keyword: 'INPUT x', descKey: 'help.pseudocodeTutorial.keyword.input.desc' },
    { keyword: 'OUTPUT value', descKey: 'help.pseudocodeTutorial.keyword.output.desc' },
    { keyword: 'x = value', descKey: 'help.pseudocodeTutorial.keyword.assign.desc' },
    { keyword: 'IF ... THEN ... ELSE ... END IF', descKey: 'help.pseudocodeTutorial.keyword.if.desc' },
    { keyword: 'FOR init; cond; update ... END FOR', descKey: 'help.pseudocodeTutorial.keyword.for.desc' },
    { keyword: 'WHILE cond ... END WHILE', descKey: 'help.pseudocodeTutorial.keyword.while.desc' },
    {
      keyword: 'SUBROUTINE name(params) [RETURNS TYPE] ... END SUBROUTINE',
      descKey: 'help.pseudocodeTutorial.keyword.subroutine.desc',
    },
    { keyword: 'x = CALL name(args)', descKey: 'help.pseudocodeTutorial.keyword.call.desc' },
    { keyword: 'RETURN value', descKey: 'help.pseudocodeTutorial.keyword.return.desc' },
  ];

  const EXAMPLE = `START
    DECLARE age AS INTEGER
    INPUT age
    IF age >= 18 THEN
        OUTPUT "Adult"
    ELSE
        OUTPUT "Minor"
    END IF
END`;
</script>

<section class="mb-4">
  <h3 class="mb-1 font-semibold">{$t('help.pseudocodeTutorial.intro.heading')}</h3>
  <p style="color: var(--color-text-secondary);">
    {$t('help.pseudocodeTutorial.intro.body')}
  </p>
</section>

<section class="mb-4">
  <h3 class="mb-2 font-semibold">{$t('help.pseudocodeTutorial.keywords.heading')}</h3>
  <table class="w-full text-left">
    <tbody>
      {#each keywords as row (row.keyword)}
        <tr style="border-top: 1px solid var(--color-border);">
          <td class="py-1 pr-3 align-top font-mono whitespace-nowrap" style="color: var(--color-accent);">{row.keyword}</td>
          <td class="py-1" style="color: var(--color-text-secondary);">{$t(row.descKey)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<section>
  <h3 class="mb-2 font-semibold">{$t('help.pseudocodeTutorial.example.heading')}</h3>
  <pre
    class="overflow-x-auto rounded border p-2 font-mono text-xs"
    style="border-color: var(--color-border); background: var(--color-canvas);">{EXAMPLE}</pre>
</section>
