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
      // Monaco defaults to padding roughly a screen's worth of blank space
      // below the last line (so it can scroll to the top), which shows a
      // scrollbar even when the actual code is short enough to fit.
      scrollBeyondLastLine: false,
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

  // Monaco sizes itself off its container's actual pixel dimensions —
  // useless while this tab is hidden behind Pseudocode (display: none, so
  // the container measures 0x0 — see CodeEditorPanel.svelte). Called once
  // this tab becomes visible again, so the editor doesn't stay squished to
  // its last-known (possibly stale, possibly zero) size.
  export function refreshLayout() {
    editor?.layout();
  }

  $effect(() => {
    monaco.editor.setTheme($theme === 'dark' ? 'vs-dark' : 'vs');
  });

  $effect(() => {
    const value = $codeContent;
    if (!editor || editor.getValue() === value) return;

    // While the user has focus here, they're the one driving codeContent
    // (onDidChangeModelContent sets it synchronously on every keystroke) —
    // never overwrite their live buffer out from under them. Creating a
    // new node (e.g. right after typing a statement's `;`) kicks off async
    // work in the flowchart (SvelteFlow measuring/mounting the new node),
    // which can echo a regenerated codeContent back to this effect *after*
    // the user has already typed further. Applying that stale value with
    // setValue() would both revert their newer keystrokes and reset the
    // cursor to the start of the document. Skipping is safe: the moment
    // they type again, their own onDidChangeModelContent call re-syncs
    // codeContent from the live buffer anyway.
    if (editor.hasTextFocus()) return;

    const position = editor.getPosition();
    const scrollTop = editor.getScrollTop();
    syncingFromStore = true;
    editor.setValue(value);
    if (position) editor.setPosition(position);
    editor.setScrollTop(scrollTop);
    syncingFromStore = false;
  });
</script>

<div class="flex h-full w-full flex-col">
  <div bind:this={container} class="min-h-0 flex-1"></div>
</div>
