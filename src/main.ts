import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
// Imported for its module-level side effect only (the flowchart -> code
// subscriptions it sets up) — nothing here calls into it directly, but
// without this import the module is never loaded and codeContent (see
// stores/code.ts) never gets regenerated when the flowchart changes.
import './stores/sync'

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
