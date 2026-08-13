<script lang="ts">
  import type { Snippet } from 'svelte';

  // Renders any clip-path polygon (parallelogram for Process/Output,
  // diamond for Decision) as a properly bordered flowchart symbol.
  // clip-path can't be combined with a plain CSS `border` (the border still
  // paints along the original rectangular edges, poking out past the
  // clipped shape) — so the "border" here is faked with two nested,
  // identically-clipped layers: an outer one in the border color, inset by
  // padding to reveal a sliver of it around an inner one in the fill color.
  let {
    clipPath,
    borderColor = 'var(--color-node-border)',
    bgColor = 'var(--color-node-bg)',
    children,
  }: {
    clipPath: string;
    borderColor?: string;
    bgColor?: string;
    children: Snippet;
  } = $props();
</script>

<div class="h-full" style="background: {borderColor}; clip-path: {clipPath}; padding: 1px;">
  <div class="h-full" style="background: {bgColor}; clip-path: {clipPath};">
    {@render children()}
  </div>
</div>
