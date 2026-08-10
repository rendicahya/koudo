import { get } from 'svelte/store';
import type { Node } from '@xyflow/svelte';
import {
  nodes,
  createDeclareNode,
  updateDeclareNodeFields,
  createProcessNode,
  updateProcessNodeLabel,
  type DeclareNodeData,
} from './flowchart';
import { codeContent } from './code';
import { generateJavaCode } from '../lib/flowchart/generator';
import { parseDeclarations } from '../lib/flowchart/declarationParser';
import { parseStatements } from '../lib/flowchart/statementParser';

// Guards against the two directions fighting each other: while one side is
// applying an update it came from, the other side's reactive sync is
// skipped for that round, so typing in the editor never gets its text
// silently replaced mid-keystroke by a flowchart-driven regeneration.
let isApplyingCodeSync = false;

function syncFlowchartToCode(nodeList: Node[]) {
  if (isApplyingCodeSync) return;
  codeContent.set(generateJavaCode(nodeList));
}

nodes.subscribe(syncFlowchartToCode);

function blockTypeOf(node: Node): string | undefined {
  return (node.data as { blockType?: string } | undefined)?.blockType;
}

export function syncCodeToFlowchart(code: string) {
  const declarations = parseDeclarations(code);
  const declByName = new Map(declarations.map((d) => [d.varName, d]));
  const statements = parseStatements(code);
  const current = get(nodes);

  // Declarations: matched by variable name — a stable identity that
  // survives reordering elsewhere in the file.
  const withoutStaleDeclares = current.filter((node) => {
    if (blockTypeOf(node) !== 'declare') return true;
    const data = node.data as Partial<DeclareNodeData>;
    return declByName.has(data.varName ?? '');
  });

  // Process/statement nodes have no natural key, so they're matched
  // positionally: the Nth Process node on the canvas <-> the Nth
  // recognized statement line in the code. Excess trailing nodes (more
  // nodes than statements left) are dropped here; excess trailing
  // statements (more statements than nodes) become new nodes below.
  let keepIndex = 0;
  const kept = withoutStaleDeclares.filter((node) => {
    if (blockTypeOf(node) !== 'process') return true;
    const keep = keepIndex < statements.length;
    keepIndex += 1;
    return keep;
  });

  let statementIndex = 0;
  const result = kept.map((node) => {
    const type = blockTypeOf(node);

    if (type === 'declare') {
      const data = node.data as Partial<DeclareNodeData>;
      const decl = declByName.get(data.varName ?? '')!;
      if (data.varType === decl.varType && data.varValue === decl.varValue) return node;
      return updateDeclareNodeFields(node, { varType: decl.varType, varValue: decl.varValue });
    }

    if (type === 'process') {
      const text = statements[statementIndex];
      statementIndex += 1;
      const label = (node.data as { label?: string }).label;
      return label === text ? node : updateProcessNodeLabel(node, text);
    }

    return node;
  });

  const existingNames = new Set(
    result
      .map((node) => node.data as Partial<DeclareNodeData>)
      .filter((data) => data.blockType === 'declare')
      .map((data) => data.varName),
  );

  let nextY = result.length > 0 ? Math.max(...result.map((node) => node.position.y)) + 90 : 50;

  for (const decl of declarations) {
    if (existingNames.has(decl.varName)) continue;
    result.push(createDeclareNode({ x: 260, y: nextY }, decl));
    nextY += 90;
  }

  for (const text of statements.slice(statementIndex)) {
    result.push(createProcessNode({ x: 260, y: nextY }, text));
    nextY += 90;
  }

  const changed = result.length !== current.length || result.some((node, i) => node !== current[i]);
  if (!changed) return;

  isApplyingCodeSync = true;
  nodes.set(result);
  isApplyingCodeSync = false;
}
