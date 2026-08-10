import type { Node } from '@xyflow/svelte';

// MVP simplification: emits one statement per node in the order the nodes
// were added (not a real graph walk from Start along edges), since the data
// model has no notion yet of what's "inside" a loop/decision body. This is
// simple and reliable rather than a graph-walker with unhandled branch/loop
// nesting edge cases — revisit once blocks can contain other blocks.
function statementFor(node: Node): string | null {
  const blockType = node.data?.blockType as string | undefined;
  const label = (node.data?.label as string | undefined) ?? '';

  switch (blockType) {
    case 'start':
    case 'end':
      return null;
    case 'process': {
      const statement = label.trim();
      return statement ? `${statement};` : null;
    }
    case 'declare': {
      const varType = (node.data?.varType as string | undefined) ?? 'int';
      const varName = (node.data?.varName as string | undefined) ?? '';
      const varValue = (node.data?.varValue as string | undefined) ?? '0';
      if (!varName.trim()) return null;
      return `${varType} ${varName} = ${varValue};`;
    }
    case 'forLoop':
      return 'for (int i = 0; i < 10; i++) {\n    // TODO: loop body\n}';
    case 'decision':
    case 'whileLoop':
      return `// TODO: ${label} — not generated yet`;
    default:
      return null;
  }
}

export function generateJavaCode(nodes: Node[]): string {
  if (nodes.length === 0) {
    return '';
  }

  if (!nodes.some((node) => node.data?.blockType === 'start')) {
    return '// Add a Start block to generate code.\n';
  }

  const lines = nodes.map(statementFor).filter((line): line is string => line !== null);

  if (lines.length === 0) {
    return '// Add Process, For Loop, or other blocks after Start to generate code.\n';
  }

  return `${lines.join('\n\n')}\n`;
}
