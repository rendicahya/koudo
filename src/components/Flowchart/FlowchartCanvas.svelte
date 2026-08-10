<script lang="ts">
  import '@xyflow/svelte/dist/style.css';
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import FlowchartBoard from './FlowchartBoard.svelte';
</script>

<div class="h-full w-full" style="background: var(--color-canvas);">
  <SvelteFlowProvider>
    <FlowchartBoard />
  </SvelteFlowProvider>
</div>
