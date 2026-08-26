<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as monaco from 'monaco-editor';
  import { codeContent } from '../../stores/code';
  import { theme } from '../../stores/theme';
  import { projectName } from '../../stores/project';
  import { codeFontSize, codeIndentStyle, codeFontId, codeFontStackFor } from '../../stores/layout';
  import { wrapAsJavaFile, sanitizeJavaClassName } from '../../lib/flowchart/exportJava';
  import { reindent } from '../../lib/codeIndent';

  let container: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor | undefined;

  // The flowchart is currently the only source of truth for the code — this
  // view is read-only (see `readOnly` below) and never writes back to it, so
  // there's no two-way sync to guard against here the way JavaCodeEditor's
  // sibling views used to need.
  let displayedCode = $derived(reindent(wrapAsJavaFile($codeContent, sanitizeJavaClassName($projectName)), $codeIndentStyle));
  let fontFamily = $derived(codeFontStackFor($codeFontId));

  onMount(() => {
    editor = monaco.editor.create(container, {
      value: displayedCode,
      language: 'java',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: $codeFontSize,
      fontFamily,
      theme: $theme === 'dark' ? 'vs-dark' : 'vs',
      // Editing is disabled for now — the canvas is the only place a user
      // edits during this phase, code generation is one-way (flowchart ->
      // code only). The default "Cannot edit in read-only editor" bubble
      // Monaco shows on a blocked keystroke is suppressed below (see
      // :global(.monaco-editor-overlaymessage)) — this should just behave
      // like a plain, uneditable view, not flag the attempt.
      readOnly: true,
      // Monaco defaults to padding roughly a screen's worth of blank space
      // below the last line (so it can scroll to the top), which shows a
      // scrollbar even when the actual code is short enough to fit.
      scrollBeyondLastLine: false,
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
    editor?.updateOptions({ fontSize: $codeFontSize, fontFamily });
  });

  $effect(() => {
    const value = displayedCode;
    if (!editor || editor.getValue() === value) return;

    // Read-only, so there's no live user buffer to preserve here — just
    // reapply the flowchart-driven text, keeping the cursor/scroll position
    // stable across the refresh.
    const position = editor.getPosition();
    const scrollTop = editor.getScrollTop();
    editor.setValue(value);
    if (position) editor.setPosition(position);
    editor.setScrollTop(scrollTop);
  });
</script>

<div class="flex h-full w-full flex-col">
  <div bind:this={container} class="min-h-0 flex-1"></div>
</div>

<style>
  /* Suppresses Monaco's "Cannot edit in read-only editor" bubble — this
     view is deliberately read-only (see readOnly above), so a blocked
     keystroke shouldn't surface a message at all. */
  :global(.monaco-editor-overlaymessage) {
    display: none !important;
  }
</style>
