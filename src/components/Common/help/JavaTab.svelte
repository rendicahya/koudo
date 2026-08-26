<script lang="ts">
  import { t } from '../../../stores/i18n';
  import type { TranslationKey } from '../../../lib/i18n/translations';

  // Code samples aren't translated (matches the rest of the app's own
  // treatment of Java syntax — see translations.ts's file-header comment) —
  // only each topic's explanation is.
  interface JavaTopic {
    id: string;
    labelKey: TranslationKey;
    bodyKey: TranslationKey;
    code: string;
  }

  const TOPICS: JavaTopic[] = [
    {
      id: 'dataTypes',
      labelKey: 'help.javaTutorial.dataTypes.label',
      bodyKey: 'help.javaTutorial.dataTypes.body',
      code: `int age = 20;
double price = 19.99;
boolean isActive = true;
char grade = 'A';
String name = "Koudo";`,
    },
    {
      id: 'variables',
      labelKey: 'help.javaTutorial.variables.label',
      bodyKey: 'help.javaTutorial.variables.body',
      code: `int score;
score = 90;
int total = score + 10;`,
    },
    {
      id: 'operators',
      labelKey: 'help.javaTutorial.operators.label',
      bodyKey: 'help.javaTutorial.operators.body',
      code: `int total = 5 + 3 * 2;
boolean canVote = age >= 17 && isCitizen;
total += 10; // same as total = total + 10;`,
    },
    {
      id: 'inputOutput',
      labelKey: 'help.javaTutorial.inputOutput.label',
      bodyKey: 'help.javaTutorial.inputOutput.body',
      code: `Scanner scanner = new Scanner(System.in);
System.out.print("Enter your age: ");
int age = scanner.nextInt();
System.out.println("You are " + age + " years old.");`,
    },
    {
      id: 'conditionals',
      labelKey: 'help.javaTutorial.conditionals.label',
      bodyKey: 'help.javaTutorial.conditionals.body',
      code: `if (age >= 18) {
    System.out.println("Adult");
} else {
    System.out.println("Minor");
}`,
    },
    {
      id: 'loops',
      labelKey: 'help.javaTutorial.loops.label',
      bodyKey: 'help.javaTutorial.loops.body',
      code: `for (int i = 0; i < 5; i++) {
    System.out.println(i);
}

int count = 0;
while (count < 5) {
    System.out.println(count);
    count++;
}`,
    },
  ];

  let activeTopic = $state<JavaTopic>(TOPICS[0]);
</script>

<div class="mb-3 flex flex-wrap gap-1 border-b" style="border-color: var(--color-border);">
  {#each TOPICS as topic (topic.id)}
    <button
      type="button"
      class="rounded-t px-2.5 py-1 text-xs font-medium"
      style="border-bottom: 2px solid {activeTopic.id === topic.id
        ? 'var(--color-accent)'
        : 'transparent'}; color: {activeTopic.id === topic.id ? 'var(--color-text)' : 'var(--color-text-secondary)'};"
      onclick={() => (activeTopic = topic)}
    >
      {$t(topic.labelKey)}
    </button>
  {/each}
</div>

{#key activeTopic.id}
  <section>
    <p class="mb-3" style="color: var(--color-text-secondary);">
      {$t(activeTopic.bodyKey)}
    </p>
    <pre
      class="overflow-x-auto rounded border p-2 font-mono text-xs"
      style="border-color: var(--color-border); background: var(--color-canvas);">{activeTopic.code}</pre>
  </section>
{/key}
