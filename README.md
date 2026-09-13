# 💻 KOUDO — コウド

Koudo is a browser-only educational web app that teaches programming fundamentals by keeping a flowchart and real Java code in sync, live, in both directions. Build a flowchart and watch the Java write itself (or type Java and watch the flowchart build itself), then **Run** or step through it one line at a time with every variable's value visible as it changes.

> **コウド** — a katakana rendering of "Koudo," playing on コード ("code").

Live: https://rendicahya.github.io/koudo/ (auto-deployed from `main`)

## Why

Beginners get stuck on fundamentals — variables, I/O, sequencing, decisions, loops — because they can't see execution happen. Koudo makes it visible: every block is a real programming concept, each becomes real Java as you build, and **Step Through** lets you watch a program run one line at a time with a live variable table beside it.

## Features

- **Blocks**: Start/End, Variable (Declare), Assign, Input, Output, Decision (if/else), For Loop, While Loop, and Subroutines (Sub Start/Call Sub/Sub End) — each maps to real, generated Java
- **Two-way sync** between the flowchart and a Monaco Java editor, plus a read-only Pseudocode tab
- **Real execution**: a hand-written interpreter actually runs the generated Java (no backend, no JVM) — supports `Run` and line-by-line **Step Through** with a live Variable Watcher
- **Guided tutorials**: a first-run walkthrough plus 5 more topic guides, replayable from Help
- **Two variable modes**: Standard (explicit types) or Beginner (type inferred from value)
- **English & Bahasa Indonesia** UI, switchable anytime
- **8 themes** (4 light / 4 dark) + System, following `prefers-color-scheme`
- **Autosave + Undo/Redo**, Save/Open as `.kdo` files, Export Java (`Main.java`) or Pseudocode
- **Canvas tools**: auto-Arrange, PNG export, resizable panels, minimizable palette

See [Help → Guide](https://rendicahya.github.io/koudo/) in the app for the full usage guide, or browse `src/` — most files carry detailed comments on the trickier logic.

### Not built yet

- Arrays, classes — anything past this single-class, beginner-first subset
- Running/stepping a flowchart that calls a Subroutine (Java/Export/Pseudocode already support it)

## Tech stack

- **Svelte 5** + **Vite**
- **[@xyflow/svelte](https://svelteflow.dev/)** — the flowchart canvas
- **Monaco Editor** — the code panel
- **Tailwind CSS v4** — styling
- **html-to-image** — PNG export
- Zero backend — everything, including code execution, runs client-side

A small custom interpreter (rather than a real JVM-in-WASM or a backend sandbox) keeps Koudo browser-only, instant to start, and free of arbitrary-code-execution risk — it only understands the restricted subset Koudo teaches.

## Getting started

```bash
npm install
npm run dev     # http://localhost:5173/koudo/
npm run build   # outputs to dist/
npm run check   # svelte-check + tsc
```

Deploys automatically to GitHub Pages on every push to `main` (see `.github/workflows/deploy.yml`).

## Project structure

```
src/
├── App.svelte                  top-level layout: navbar, resizable panels, SvelteFlowProvider
├── components/
│   ├── Flowchart/               block palette + one component per block type, canvas board
│   ├── CodeEditor/               Java/Pseudocode tabs, Monaco wrapper
│   ├── Output/                  Run/Step/Stop, output log, Variable Watcher
│   └── Common/                  navbar, menus, tutorial, theme toggle, toasts
├── stores/                      flowchart state, code sync, run/step engine, settings, i18n, theme, history
└── lib/
    ├── flowchart/                flowchart <-> Java/Pseudocode generation & parsing
    ├── execution/                the interpreter (tokenizer, parser, interpreter)
    ├── i18n/                     English/Indonesian UI strings
    └── storage/                  persisted panel prefs, .kdo save/load
```

## License

MIT — see [LICENSE](./LICENSE).
