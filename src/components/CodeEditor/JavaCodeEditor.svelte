<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as monaco from 'monaco-editor';
  import { codeContent } from '../../stores/code';
  import { theme } from '../../stores/theme';
  import { syncCodeToFlowchart } from '../../stores/sync';

  let container: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor | undefined;
  let syncingFromStore = false;

  onMount(() => {
    editor = monaco.editor.create(container, {
      value: $codeContent,
      language: 'java',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      theme: $theme === 'dark' ? 'vs-dark' : 'vs',
    });

    editor.onDidChangeModelContent(() => {
      if (syncingFromStore) return;
      const value = editor!.getValue();
      codeContent.set(value);
      syncCodeToFlowchart(value);
    });
  });

  onDestroy(() => {
    editor?.dispose();
  });

  $effect(() => {
    monaco.editor.setTheme($theme === 'dark' ? 'vs-dark' : 'vs');
  });

  $effect(() => {
    const value = $codeContent;
    if (editor && editor.getValue() !== value) {
      syncingFromStore = true;
      editor.setValue(value);
      syncingFromStore = false;
    }
  });
</script>

<div class="flex h-full w-full flex-col">
  <div
    class="border-b px-3 py-1 text-xs"
    style="border-color: var(--color-border); color: var(--color-text-secondary); background: var(--color-panel);"
  >
    Synced with the flowchart — variable declarations (<code>int x = 5;</code> etc.) go both ways, other blocks are
    flowchart → code only for now.
  </div>
  <div bind:this={container} class="min-h-0 flex-1"></div>
</div>
