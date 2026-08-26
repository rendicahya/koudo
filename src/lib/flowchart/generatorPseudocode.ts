import type { Edge, Node } from '@xyflow/svelte';
import { blockTypeOf, outgoing, findMergePoint, declaredVariableEntriesUpstreamOf } from './graphWalk';
import { formatDeclaredValue } from './valueFormat';

// Mirrors stores/flowchart.ts's own printlnContent — duplicated rather than
// imported so this stays a pure lib/flowchart module independent of the
// stateful stores singleton, same as generator.ts's own local
// escapeJavaString.
const PRINTLN_PATTERN = /^System\.out\.println\((.*)\)$/;
function printlnContent(statement: string): string | null {
  const match = statement.match(PRINTLN_PATTERN);
  return match ? match[1] : null;
}

// A learner-facing word for a Declare entry's Java type — pseudocode reads
// naturally in words ("DECLARE x AS INTEGER"), not Java keywords.
function typeWord(varType: string): string {
  switch (varType) {
    case 'int':
    case 'long':
      return 'INTEGER';
    case 'double':
    case 'float':
      return 'REAL';
    case 'boolean':
      return 'BOOLEAN';
    case 'char':
      return 'CHARACTER';
    case 'String':
      return 'STRING';
    default:
      return varType.toUpperCase();
  }
}

// Java's compound assignment operators ('+=', ...) don't read naturally in
// pseudocode — spelled out as "x = x + value" instead, same value Java's own
// `x += value` would produce.
function assignmentLine(varName: string, operator: string, value: string): string {
  if (operator === '=') return `${varName} = ${value}`;
  const symbol = operator[0];
  return `${varName} = ${varName} ${symbol} ${value}`;
}

function statementLinesFor(node: Node, nodesById: Map<string, Node>, edges: Edge[]): string[] {
  const blockType = blockTypeOf(node);

  switch (blockType) {
    case 'start':
    case 'end':
    case 'subroutineStart':
    case 'subroutineEnd':
    case 'decision':
    case 'forLoop':
    case 'whileLoop':
      return [];
    case 'subroutineCall': {
      const data = node.data as { targetId?: string; args?: string[] } | undefined;
      const targetNode = data?.targetId ? nodesById.get(data.targetId) : undefined;
      const name = (targetNode?.data as { name?: string } | undefined)?.name;
      if (!name) return [];
      const args = data?.args ?? [];
      return [`CALL ${name}(${args.join(', ')})`];
    }
    case 'process': {
      const statements = (node.data?.statements as string[] | undefined) ?? [];
      return statements
        .map((statement) => statement.trim())
        .filter(Boolean)
        .map((statement) => {
          const content = printlnContent(statement);
          return `OUTPUT ${content ?? statement}`;
        });
    }
    case 'declare': {
      const entries = (node.data?.entries as { varType: string; varName: string; varValue: string }[] | undefined) ?? [];
      return entries
        .filter((entry) => entry.varName.trim())
        .map((entry) => {
          // Not .trim() — a value that's just a space is a real (String)
          // value the user typed on purpose, not "no value given".
          const hasValue = entry.varValue.length > 0;
          return hasValue
            ? `DECLARE ${entry.varName} AS ${typeWord(entry.varType)} = ${formatDeclaredValue(entry.varType, entry.varValue)}`
            : `DECLARE ${entry.varName} AS ${typeWord(entry.varType)}`;
        });
    }
    case 'assign': {
      const entries = (node.data?.entries as { varName: string; operator: string; value: string }[] | undefined) ?? [];
      const nodeList = [...nodesById.values()];
      const declarations = declaredVariableEntriesUpstreamOf(node.id, nodeList, edges);
      const declaredNames = new Set(declarations.map((d) => d.varName));
      return entries
        .filter((entry) => entry.varName.trim() && entry.value.trim())
        .map((entry) => {
          const isVarRef = declaredNames.has(entry.value);
          const targetType = declarations.find((d) => d.varName === entry.varName)?.varType;
          const value = isVarRef || !targetType ? entry.value : formatDeclaredValue(targetType, entry.value);
          return assignmentLine(entry.varName, entry.operator, value);
        });
    }
    case 'input': {
      const entries = (node.data?.entries as { varName: string; prompt: string }[] | undefined) ?? [];
      const lines: string[] = [];
      entries.forEach((entry) => {
        if (!entry.varName.trim()) return;
        if (entry.prompt.trim()) lines.push(`OUTPUT "${entry.prompt}"`);
        lines.push(`INPUT ${entry.varName}`);
      });
      return lines;
    }
    default:
      return [];
  }
}

function indent(lines: string[]): string[] {
  return lines.map((line) => `    ${line}`);
}

// Structurally identical to generator.ts's walk() — same branching/looping
// traversal — just emitting pseudocode keywords instead of Java syntax.
function walk(nodeId: string | null, stopId: string | null, nodesById: Map<string, Node>, edges: Edge[], guard: Set<string>): string[] {
  const lines: string[] = [];
  let currentId = nodeId;

  while (currentId && currentId !== stopId) {
    if (guard.has(currentId)) break;
    guard.add(currentId);

    const node = nodesById.get(currentId);
    if (!node) break;

    if (blockTypeOf(node) === 'decision') {
      const trueId = outgoing(edges, currentId, 'true');
      const falseId = outgoing(edges, currentId, 'false');
      const mergeId = findMergePoint(trueId, falseId, nodesById, edges);
      const condition = ((node.data?.condition as string | undefined) ?? '').trim() || 'true';

      lines.push(`IF ${condition} THEN`);
      lines.push(...indent(walk(trueId, mergeId, nodesById, edges, guard)));
      if (falseId) {
        lines.push('ELSE');
        lines.push(...indent(walk(falseId, mergeId, nodesById, edges, guard)));
      }
      lines.push('END IF');

      currentId = mergeId;
      continue;
    }

    if (blockTypeOf(node) === 'forLoop') {
      const bodyId = outgoing(edges, currentId, 'loop');
      const data = node.data as { init?: string; condition?: string; update?: string } | undefined;
      const init = (data?.init ?? '').trim();
      const condition = (data?.condition ?? '').trim() || 'true';
      const update = (data?.update ?? '').trim();

      lines.push(`FOR ${init}; ${condition}; ${update}`);
      lines.push(...indent(walk(bodyId, currentId, nodesById, edges, guard)));
      lines.push('END FOR');

      currentId = outgoing(edges, currentId, 'exit');
      continue;
    }

    if (blockTypeOf(node) === 'whileLoop') {
      const bodyId = outgoing(edges, currentId, 'loop');
      const condition = ((node.data?.condition as string | undefined) ?? '').trim() || 'true';

      lines.push(`WHILE ${condition}`);
      lines.push(...indent(walk(bodyId, currentId, nodesById, edges, guard)));
      lines.push('END WHILE');

      currentId = outgoing(edges, currentId, 'exit');
      continue;
    }

    lines.push(...statementLinesFor(node, nodesById, edges));
    currentId = outgoing(edges, currentId, null);
  }

  return lines;
}

// Unlike generateJavaCode (whose codeContent is just the bare method body —
// see stores/code.ts, wrapped into a real class only at Export Java time),
// pseudocode has no separate export step to add the START/END frame later,
// so it's included directly here — and, unlike Java, pseudocode has no
// interpreter consuming it that a SUBROUTINE block would break (see
// generator.ts's generateJavaMethods for why Java keeps them separate), so
// each Subroutine Start's own body is appended directly below the main
// program, in the same string.
export function generatePseudocode(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return '';

  const startNode = nodes.find((node) => blockTypeOf(node) === 'start');
  if (!startNode) return '// Add a Start block to generate pseudocode.\n';

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const lines = walk(startNode.id, null, nodesById, edges, new Set());
  const mainBlock = `START\n${indent(lines).join('\n')}\nEND`;

  const subroutineStarts = nodes.filter((node) => blockTypeOf(node) === 'subroutineStart');
  const subroutineBlocks = subroutineStarts.map((subNode) => {
    const data = subNode.data as { name?: string; params?: { paramType: string; paramName: string }[] } | undefined;
    const name = data?.name || 'method';
    const paramList = (data?.params ?? []).map((p) => p.paramName).join(', ');
    const bodyLines = walk(subNode.id, null, nodesById, edges, new Set());
    return `SUBROUTINE ${name}(${paramList})\n${indent(bodyLines).join('\n')}\nEND SUBROUTINE`;
  });

  return [mainBlock, ...subroutineBlocks].join('\n\n') + '\n';
}
