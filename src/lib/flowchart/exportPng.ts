import { toPng } from 'html-to-image';
import { getViewportForBounds, type Node, type Rect } from '@xyflow/svelte';

// Fixed output size (not "whatever the window happens to be") so the PNG
// looks the same regardless of how the browser was sized when it was
// downloaded.
const EXPORT_WIDTH = 1280;
const EXPORT_HEIGHT = 960;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;
const BOUNDS_PADDING = 0.1;

// Renders the flowchart as a PNG data URL, framed to fit every node — not
// just whichever part happens to be scrolled into view — by computing the
// bounds of all nodes and the pan/zoom that fits them into EXPORT_WIDTH x
// EXPORT_HEIGHT, the same technique as xyflow's own "download image"
// examples (getNodesBounds + getViewportForBounds), paired with
// html-to-image to actually rasterize the DOM.
//
// getNodesBounds is passed in from useSvelteFlow() rather than imported
// directly — xyflow warns that the standalone export can't see sub-flows,
// and only the hook-bound version has the node lookup to do that correctly.
//
// skipFonts avoids html-to-image's own font-embedding pass, which tries to
// fetch() and inline every stylesheet it finds (including Tailwind's) —
// pointless work since this app only uses system fonts, and prone to
// throwing an opaque "[object Event]" rejection if any of those fetches
// fails.
export function flowchartToPngDataUrl(
  viewportEl: HTMLElement,
  nodes: Node[],
  backgroundColor: string,
  getNodesBounds: (nodes: Node[]) => Rect,
): Promise<string> {
  const bounds = getNodesBounds(nodes);
  const viewport = getViewportForBounds(bounds, EXPORT_WIDTH, EXPORT_HEIGHT, MIN_ZOOM, MAX_ZOOM, BOUNDS_PADDING);

  return toPng(viewportEl, {
    backgroundColor,
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    skipFonts: true,
    style: {
      width: `${EXPORT_WIDTH}px`,
      height: `${EXPORT_HEIGHT}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });
}
