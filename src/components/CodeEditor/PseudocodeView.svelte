<script lang="ts">
  import { nodes, edges } from '../../stores/flowchart';
  import { generatePseudocode } from '../../lib/flowchart/generatorPseudocode';
  import { codeFontSize, codeIndentStyle, codeFontId, codeFontStackFor } from '../../stores/layout';
  import { reindent } from '../../lib/codeIndent';

  // Read-only, one-directional projection of the flowchart — unlike the Java
  // tab (see JavaCodeEditor.svelte + stores/sync.ts), there's no editor to
  // type pseudocode back into the flowchart, so this just derives fresh text
  // straight off the nodes/edges stores instead of going through its own
  // writable store.
  let pseudocode = $derived(reindent(generatePseudocode($nodes, $edges), $codeIndentStyle));
  let fontFamily = $derived(codeFontStackFor($codeFontId));
</script>

<div class="h-full w-full overflow-auto p-4">
  <pre
    class="whitespace-pre-wrap"
    style="color: var(--color-text); font-size: {$codeFontSize}px; font-family: {fontFamily};">{pseudocode}</pre>
</div>
