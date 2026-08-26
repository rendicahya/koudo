import { mount } from 'svelte'
import './app.css'
// Self-hosted @font-face declarations for the code font picker (see
// stores/layout.ts's CODE_FONT_OPTIONS) — without these, picking e.g.
// "JetBrains Mono" only worked for the (rare) user who happened to already
// have it installed as a system font; everyone else silently got the
// generic-monospace fallback with no visible change. Each package declares
// several unicode-range subsets, but browsers only fetch the subset(s)
// actually used on the page, so importing the whole file (not just a
// hand-picked "latin" slice) costs nothing extra in practice. Consolas is
// deliberately not here — it's a proprietary Microsoft font with no
// redistributable web-font version, so it stays a system-font-only option
// (falls back to generic monospace on non-Windows, same as before).
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/fira-code/400.css'
import '@fontsource/cascadia-code/400.css'
import '@fontsource/roboto-mono/400.css'
// These three are imported for their module-level side effects only (each
// wires up its own store subscriptions — nothing here calls into them
// directly), and deliberately BEFORE `App.svelte` below: App's own import
// tree also reaches stores/history.ts (TopNavbar's undo/redo buttons), and
// JS evaluates a module's imports in source order — if App were imported
// first, history.ts would capture its undo baseline from the default empty
// canvas, before autosave.ts got a chance to restore the saved one, and a
// single Ctrl+Z right after load would wipe it back out.
//
// Sync: the flowchart -> code subscriptions; without this import the module
// is never loaded and codeContent (see stores/code.ts) never regenerates
// when the flowchart changes.
import './stores/sync'
// Autosave: restores the last saved canvas (if any) before the app's first
// paint, then keeps re-saving on every edit.
import './stores/autosave'
// History: undo/redo for canvas edits — imported last of the three so its
// baseline snapshot reflects whatever autosave.ts just restored.
import './stores/history'
import App from './App.svelte'
import editorWorker from 'monaco-editor/editor/editor.worker?worker'

// Monaco needs its web worker wired up manually under Vite.
self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker()
  },
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
