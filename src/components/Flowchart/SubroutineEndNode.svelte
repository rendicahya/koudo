<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { t } from '../../stores/i18n';
</script>

<!-- Same role as the main flow's End block (just marks where this
     subroutine's body stops) — no source Handle, since nothing continues
     past it, same as End. A distinct blockType (see SubroutineEndNodeData)
     keeps it out of End-specific checks (singleton, hasConnectedEndBlock). -->
<div
  class="px-4 py-1.5 text-center text-xs"
  style="border-radius: 9999px; border: 1px solid var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />
  {$t('subroutineEnd.label')}
</div>
