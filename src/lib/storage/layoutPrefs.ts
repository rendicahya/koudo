const STORAGE_KEY = 'koudo-layout';

export interface LayoutPrefs {
  flowchartPercent: number;
  outputHeight: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function loadLayoutPrefs(defaults: LayoutPrefs, bounds: { percent: [number, number]; height: [number, number] }): LayoutPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<LayoutPrefs>;
    return {
      flowchartPercent: clamp(
        typeof parsed.flowchartPercent === 'number' ? parsed.flowchartPercent : defaults.flowchartPercent,
        ...bounds.percent,
      ),
      outputHeight: clamp(
        typeof parsed.outputHeight === 'number' ? parsed.outputHeight : defaults.outputHeight,
        ...bounds.height,
      ),
    };
  } catch {
    return defaults;
  }
}

export function saveLayoutPrefs(prefs: LayoutPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
