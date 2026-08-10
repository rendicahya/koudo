export interface LoopStep {
  iteration: number;
  variables: Record<string, number>;
  output: string;
}

export function traceForLoop(variable: string, start: number, end: number, step = 1): LoopStep[] {
  const steps: LoopStep[] = [];
  let iteration = 0;
  for (let value = start; value < end; value += step) {
    steps.push({
      iteration,
      variables: { [variable]: value },
      output: String(value),
    });
    iteration++;
  }
  return steps;
}
