<script lang="ts">
  import { nodes, edges } from '../../stores/flowchart';
  import { generatePseudocode } from '../../lib/flowchart/generatorPseudocode';

  // Read-only, one-directional projection of the flowchart — unlike the Java
  // tab (see JavaCodeEditor.svelte + stores/sync.ts), there's no editor to
  // type pseudocode back into the flowchart, so this just derives fresh text
  // straight off the nodes/edges stores instead of going through its own
  // writable store.
  let pseudocode = $derived(generatePseudocode($nodes, $edges));
</script>

<div class="h-full w-full overflow-auto p-4">
  <pre class="font-mono text-sm whitespace-pre-wrap" style="color: var(--color-text);">{pseudocode}</pre>
</div>
