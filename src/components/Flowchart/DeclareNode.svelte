<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { nodes, updateDeclareNodeFields, type DeclareNodeData } from '../../stores/flowchart';

  let { id, data }: NodeProps = $props();
  let nodeData = $derived(data as DeclareNodeData);

  function handleInput(field: 'varType' | 'varName' | 'varValue', event: Event) {
    const value = (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
    $nodes = $nodes.map((node) => (node.id === id ? updateDeclareNodeFields(node, { [field]: value }) : node));
  }
</script>

<div
  class="flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs"
  style="border-color: var(--color-node-border); background: var(--color-node-bg); color: var(--color-text);"
>
  <Handle type="target" position={Position.Top} />

  <select
    value={nodeData.varType}
    onchange={(event) => handleInput('varType', event)}
    class="nodrag rounded border bg-transparent px-1 py-0.5"
    style="border-color: var(--color-border);"
  >
    <option value="int">int</option>
    <option value="double">double</option>
    <option value="boolean">boolean</option>
    <option value="String">String</option>
  </select>

  <input
    value={nodeData.varName}
    oninput={(event) => handleInput('varName', event)}
    class="nodrag w-14 rounded border bg-transparent px-1 py-0.5"
    style="border-color: var(--color-border);"
    placeholder="name"
  />

  <span>=</span>

  <input
    value={nodeData.varValue}
    oninput={(event) => handleInput('varValue', event)}
    class="nodrag w-16 rounded border bg-transparent px-1 py-0.5"
    style="border-color: var(--color-border);"
    placeholder="value"
  />

  <Handle type="source" position={Position.Bottom} />
</div>
