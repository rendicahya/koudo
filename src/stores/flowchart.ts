import type { Edge, Node } from '@xyflow/svelte';
import { derived, writable } from 'svelte/store';

export type BlockType = 'start' | 'end' | 'process' | 'declare' | 'forLoop' | 'decision' | 'whileLoop';

export interface DeclareNodeData extends Record<string, unknown> {
  blockType: 'declare';
  label: string;
  varType: string;
  varName: string;
  varValue: string;
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  /** Visually present in the palette, but not functionally wired yet (Phase 2). */
  comingSoon?: boolean;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: 'start', label: 'Start' },
  { type: 'end', label: 'End' },
  { type: 'process', label: 'Process' },
  { type: 'declare', label: 'Variable' },
  { type: 'forLoop', label: 'For Loop' },
  { type: 'decision', label: 'Decision', comingSoon: true },
  { type: 'whileLoop', label: 'While Loop', comingSoon: true },
];

const XYFLOW_NODE_TYPE: Partial<Record<BlockType, string>> = {
  start: 'input',
  end: 'output',
};

// Flowchart terminal symbol: fully rounded (pill/stadium) left and right.
const PILL_STYLE = 'border-radius: 9999px; padding: 8px 20px;';

const XYFLOW_NODE_STYLE: Partial<Record<BlockType, string>> = {
  start: PILL_STYLE,
  end: PILL_STYLE,
};

let nodeCounter = 0;

export function createBlockNode(type: BlockType, position: { x: number; y: number }): Node {
  const definition = BLOCK_DEFINITIONS.find((block) => block.type === type);
  if (!definition) throw new Error(`Unknown block type: ${type}`);

  nodeCounter += 1;

  // Process nodes hold a real Java statement (generated verbatim), not a
  // label — seed something valid rather than the palette chip's name.
  const label =
    type === 'process'
      ? 'System.out.println("Hello")'
      : definition.comingSoon
        ? `${definition.label} (soon)`
        : definition.label;

  return {
    id: `${type}-${nodeCounter}`,
    type: XYFLOW_NODE_TYPE[type],
    data: { label, blockType: type },
    position,
    style: XYFLOW_NODE_STYLE[type],
    class: definition.comingSoon ? 'opacity-50' : undefined,
  };
}

export function createProcessNode(position: { x: number; y: number }, label: string): Node {
  nodeCounter += 1;
  return {
    id: `process-${nodeCounter}`,
    data: { blockType: 'process', label },
    position,
  };
}

export function updateProcessNodeLabel(node: Node, label: string): Node {
  return { ...node, data: { ...node.data, label } };
}

export function declareLabel(varType: string, varName: string, varValue: string): string {
  return `${varType} ${varName} = ${varValue}`;
}

export function createDeclareNode(
  position: { x: number; y: number },
  overrides?: { varType?: string; varName?: string; varValue?: string },
): Node {
  nodeCounter += 1;
  const varType = overrides?.varType ?? 'int';
  const varName = overrides?.varName ?? `var${nodeCounter}`;
  const varValue = overrides?.varValue ?? '0';

  return {
    id: `declare-${nodeCounter}`,
    type: 'declare',
    data: { blockType: 'declare', label: declareLabel(varType, varName, varValue), varType, varName, varValue },
    position,
  };
}

export function updateDeclareNodeFields(
  node: Node,
  fields: { varType?: string; varName?: string; varValue?: string },
): Node {
  const current = node.data as Partial<DeclareNodeData>;
  const varType = fields.varType ?? current.varType ?? 'int';
  const varName = fields.varName ?? current.varName ?? 'value';
  const varValue = fields.varValue ?? current.varValue ?? '0';

  return {
    ...node,
    data: { ...node.data, varType, varName, varValue, label: declareLabel(varType, varName, varValue) },
  };
}

function createDefaultNodes(): Node[] {
  return [createBlockNode('start', { x: 50, y: 50 })];
}

export const nodes = writable<Node[]>(createDefaultNodes());
export const edges = writable<Edge[]>([]);

// True once the canvas differs from the default "just a Start block" state —
// used to warn before an accidental refresh/close discards the work, since
// there's no save/load yet (see CLAUDE.md > Next Steps).
export const isFlowchartDirty = derived(
  [nodes, edges],
  ([$nodes, $edges]) => $nodes.length > 1 || $edges.length > 0,
);

export function duplicateNodeById(nodeId: string) {
  nodes.update((current) => {
    const original = current.find((node) => node.id === nodeId);
    if (!original) return current;

    nodeCounter += 1;
    const prefix = (original.data?.blockType as string | undefined) ?? 'node';
    const copy: Node = {
      ...original,
      id: `${prefix}-${nodeCounter}`,
      position: { x: original.position.x + 30, y: original.position.y + 30 },
      selected: false,
    };
    return [...current, copy];
  });
}

export function deleteNodeById(nodeId: string) {
  nodes.update((current) => current.filter((node) => node.id !== nodeId));
  edges.update((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
}
