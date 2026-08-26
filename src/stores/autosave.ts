import { get } from 'svelte/store';
import { nodes, edges, loadFlowchart } from './flowchart';
import { projectName, setProjectNameLive } from './project';
import { serializeFlowchart, parseFlowchartFile } from '../lib/storage/flowchartFile';

// Keeps the canvas alive across a refresh/close without the user needing to
// remember to hit Save — a separate slot from an actual Save Project file
// (see lib/storage/flowchartFile.ts, reused here for its same JSON shape),
// since this one is meant to be overwritten silently and constantly, not
// picked deliberately via Open Project.
const AUTOSAVE_KEY = 'koudo-autosave';
// Coalesces a burst of edits (typing a variable name character by character,
// dragging a block) into one write instead of one per keystroke/frame.
const AUTOSAVE_DEBOUNCE_MS = 500;

// Runs once at import time (see main.ts), before the app's first paint —
// loadFlowchart both replaces the default single-Start-block canvas and
// resyncs the node id counter, same as Open Project does for a user-picked
// file.
function restore() {
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return;
  try {
    const project = parseFlowchartFile(raw);
    loadFlowchart(project.nodes, project.edges);
    if (project.name) setProjectNameLive(project.name);
  } catch {
    // Corrupted/unreadable autosave — start fresh rather than blocking the
    // app from loading at all.
    localStorage.removeItem(AUTOSAVE_KEY);
  }
}

restore();

let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleSave() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    localStorage.setItem(AUTOSAVE_KEY, serializeFlowchart(get(nodes), get(edges), get(projectName)));
  }, AUTOSAVE_DEBOUNCE_MS);
}

nodes.subscribe(scheduleSave);
edges.subscribe(scheduleSave);
projectName.subscribe(scheduleSave);
