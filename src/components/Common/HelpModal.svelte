<script lang="ts">
  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  const blockGuide: { symbol: string; name: string; desc: string }[] = [
    { symbol: '⬭', name: 'Start / End', desc: 'The two terminal blocks every flowchart needs — one of each, at most.' },
    {
      symbol: '▭',
      name: 'Variable',
      desc: 'Declares a variable. In Beginner mode, just type a value and its type is inferred automatically; in Standard mode, pick the type yourself.',
    },
    { symbol: '▭', name: 'Assign', desc: 'Changes a variable already in scope, with =, +=, -=, *=, or /=.' },
    { symbol: '▱', name: 'Input', desc: 'Reads a value from the user into a variable, with an optional prompt.' },
    { symbol: '▱', name: 'Output', desc: 'Prints a variable’s value to the Output panel.' },
    { symbol: '◇', name: 'If', desc: 'Branches on a condition, into independently-wireable True/False paths.' },
    { symbol: '⬡', name: 'For', desc: 'A counting loop — init, condition, and update, wired back on itself to close the loop.' },
    { symbol: '◇', name: 'While', desc: 'A condition-only loop, wired back on itself the same way as For.' },
  ];

  const shortcuts: { keys: string; action: string }[] = [
    { keys: 'Alt+Shift+R', action: 'Run' },
    { keys: 'Alt+Shift+S', action: 'Step / Next Step' },
    { keys: 'Alt+Shift+A', action: 'Arrange' },
    { keys: 'Alt+Shift+T', action: 'Toggle dark / light mode' },
  ];

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0, 0, 0, 0.5);"
    role="button"
    tabindex="-1"
    aria-label="Close"
    onclick={onclose}
    onkeydown={handleKeydown}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      tabindex="-1"
      class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border shadow-lg"
      style="border-color: var(--color-border); background: var(--color-panel); color: var(--color-text);"
      onclick={(event) => event.stopPropagation()}
      onkeydown={() => {}}
    >
      <div class="flex shrink-0 items-center justify-between border-b px-4 py-3" style="border-color: var(--color-border);">
        <h2 id="help-modal-title" class="text-base font-semibold">How to Use KOUDO</h2>
        <button
          type="button"
          class="rounded px-2 leading-none hover:opacity-70"
          style="color: var(--color-text-secondary);"
          title="Close"
          onclick={onclose}
        >
          ×
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
        <section class="mb-4">
          <h3 class="mb-1 font-semibold">Getting started</h3>
          <p style="color: var(--color-text-secondary);">
            Drag a block from the palette (top-left of the canvas) and drop it below Start. Connect blocks by dragging from
            the small handle at the bottom of one block to the top of another — dropping a new block onto the bottom of the
            flow, or directly between two already-connected blocks, wires it in automatically.
          </p>
        </section>

        <section class="mb-4">
          <h3 class="mb-2 font-semibold">Block types</h3>
          <ul class="flex flex-col gap-1.5">
            {#each blockGuide as block (block.name)}
              <li class="flex gap-2">
                <span class="w-5 shrink-0 text-center" style="color: var(--color-accent);">{block.symbol}</span>
                <span><strong>{block.name}</strong> — <span style="color: var(--color-text-secondary);">{block.desc}</span></span>
              </li>
            {/each}
          </ul>
        </section>

        <section class="mb-4">
          <h3 class="mb-1 font-semibold">Running your program</h3>
          <p style="color: var(--color-text-secondary);">
            <strong>▶ Run</strong>, <strong>⏭ Step</strong>, and <strong>⏹ Stop</strong> live above the Output panel. Run
            executes the whole program at once — the Output panel shows what it prints. Step runs it one line at a time
            instead, highlighting the block currently executing and updating a live <strong>Variable Watcher</strong> table
            after every step. Both need a connected End block first.
          </p>
        </section>

        <section class="mb-4">
          <h3 class="mb-1 font-semibold">Code panel</h3>
          <p style="color: var(--color-text-secondary);">
            The <strong>Java</strong> tab is a real editor, kept in sync with the flowchart in both directions — edit either
            one and the other updates. The <strong>Pseudocode</strong> tab shows the same program in plain structured
            English, for reading — it's generated from the flowchart, not editable itself.
          </p>
        </section>

        <section class="mb-4">
          <h3 class="mb-1 font-semibold">Variable modes</h3>
          <p style="color: var(--color-text-secondary);">
            Switch modes from the <strong>Project</strong> menu. <strong>Beginner Mode</strong> (the default) infers a
            variable's type from the value you give it — no type names to learn yet. <strong>Standard Mode</strong> is the
            traditional way: you pick the type yourself, and a value is optional.
          </p>
        </section>

        <section class="mb-4">
          <h3 class="mb-1 font-semibold">Menus</h3>
          <p style="color: var(--color-text-secondary);">
            <strong>Project</strong> — New, Open/Save Project, Export Java (a compilable <code>Main.java</code>), and the
            variable-mode switch above. <strong>Canvas</strong> — Arrange (tidy the layout into columns) and Download PNG.
          </p>
        </section>

        <section class="mb-4">
          <h3 class="mb-1 font-semibold">Keyboard shortcuts</h3>
          <table class="w-full text-left">
            <tbody>
              {#each shortcuts as row (row.keys)}
                <tr style="border-top: 1px solid var(--color-border);">
                  <td class="py-1 pr-3 font-mono" style="color: var(--color-accent);">{row.keys}</td>
                  <td class="py-1">{row.action}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </section>

        <section>
          <h3 class="mb-1 font-semibold">Tips</h3>
          <ul class="list-disc pl-5" style="color: var(--color-text-secondary);">
            <li>Dropping a block of the same kind onto an existing one merges them into a single block with multiple lines.</li>
            <li>Right-click a block or a connecting line to Duplicate or Delete it.</li>
            <li>The ⛶ button, top-right, toggles fullscreen.</li>
            <li>Everything runs entirely in your browser — nothing you build is ever sent anywhere.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
{/if}
