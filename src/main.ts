import { mount } from 'svelte'
import './app.css'
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
