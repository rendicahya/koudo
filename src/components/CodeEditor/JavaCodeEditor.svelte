<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as monaco from 'monaco-editor';
  import { codeContent } from '../../stores/code';
  import { isDark } from '../../stores/theme';
  import { projectName } from '../../stores/project';
  import { nodes, edges } from '../../stores/flowchart';
  import { codeFontSize, codeIndentStyle, codeFontId, codeFontStackFor } from '../../stores/layout';
  import { wrapAsJavaFile, sanitizeJavaClassName } from '../../lib/flowchart/exportJava';
  import { generateJavaMethods } from '../../lib/flowchart/generator';
  import { reindent } from '../../lib/codeIndent';

  let container: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor | undefined;
  let containerObserver: ResizeObserver | undefined;

  // The flowchart is currently the only source of truth for the code — this
  // view is read-only (see `readOnly` below) and never writes back to it, so
  // there's no two-way sync to guard against here the way JavaCodeEditor's
  // sibling views used to need.
  let displayedCode = $derived(
    reindent(
      wrapAsJavaFile($codeContent, sanitizeJavaClassName($projectName), generateJavaMethods($nodes, $edges)),
      $codeIndentStyle,
    ),
  );
  let fontFamily = $derived(codeFontStackFor($codeFontId));

  onMount(() => {
    editor = monaco.editor.create(container, {
      value: displayedCode,
      language: 'java',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: $codeFontSize,
      fontFamily,
      theme: $isDark ? 'vs-dark' : 'vs',
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

    // Monaco sizes itself off its container's actual pixel dimensions —
    // `automaticLayout: true` above only catches a real window resize, not
    // an ancestor's CSS `display` flipping from none to visible (this whole
    // container measures 0x0 while hidden, whether that's Pseudocode/Java's
    // own toggle just below, the desktop code-panel show/hide toggle, or a
    // mobile tab switch — see App.svelte's MOBILE_TABS/CodeEditorPanel.svelte).
    // A ResizeObserver does fire once the container regains a real size, so
    // this catches all of those uniformly instead of each caller needing to
    // remember to call refreshLayout() itself.
    containerObserver = new ResizeObserver(() => editor?.layout());
    containerObserver.observe(container);
  });

  onDestroy(() => {
    containerObserver?.disconnect();
    editor?.dispose();
  });

  // Kept as an explicit, immediate alternative alongside the ResizeObserver
  // above — CodeEditorPanel's own Pseudocode/Java toggle already called this
  // the instant activeCodeTab changes, which can land a frame or two earlier
  // than the observer's own callback.
  export function refreshLayout() {
    editor?.layout();
  }

  $effect(() => {
    monaco.editor.setTheme($isDark ? 'vs-dark' : 'vs');
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
