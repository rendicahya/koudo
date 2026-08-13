# 💻 KOUDO — コウド

**Your code story.**

Koudo is a browser-only educational web app that helps absolute beginners understand Java looping (and now branching) by keeping a flowchart and real Java code in sync, live, in both directions — plus a real (if intentionally small) Java interpreter, so **Run** actually produces output instead of a canned demo.

> **コウド** — a Japanese-katakana rendering of "Koudo," playing on コード ("code" as a loanword). Direct, simple, easy to say internationally.

Live: https://rendicahya.github.io/koudo/ (auto-deployed from `main`)

## Why

Beginners get stuck on loops — and branches — because they can't see execution happen: they know the syntax but don't "feel" the logic. Koudo makes that visible. Build a flowchart and watch the Java code generate itself, or type Java and watch the flowchart build itself, then hit Run and see real output from a real (if narrow) interpreter.

## Status

Koudo is a work in progress. What's functional today:

### Flowchart ↔ code, both directions

- **Start** — terminal block, singleton (the palette disables it once one already exists on the canvas)
- **Variable** (Declare) — pick a type, name, and value. Drag another Variable block onto the bottom of the flow (or click **+ Add variable** on the block itself) to merge multiple declarations into one block, each producing its own line
- **Output** (Process/println) — pick a variable to print from a dropdown, shaped as a parallelogram per flowchart convention. Same merge-or-add-another-line behavior as Variable
- **Decision** (if) — a real branching block: a diamond with a condition field and two independently-wireable handles (**True** / **False**), each allowed its own outgoing edge — the one block where "one line out" doesn't apply to the whole node
- **End** — terminal block, singleton
- *For Loop / While Loop* — visible in the palette as inert placeholders (original MVP scope). Dragging one in shows a "(soon)" block but doesn't generate real code yet

Dragging a new block auto-connects it to whatever's currently at the bottom of the flow. Manually connecting two handles replaces whatever that handle already pointed to — every block gets exactly one outgoing line, except Decision's two branches. Right-click a block or a connecting line for Duplicate/Delete. **Arrange** (button, or `Alt+Shift+A`) snaps everything into one straight, evenly spaced column, sized to each block's actual rendered height.

Typing directly into the Monaco editor parses back into the flowchart live (variable declarations and simple statements), without fighting your cursor position or losing focus mid-keystroke.

### Real execution, not mocked

A small hand-written interpreter (`src/lib/execution/interpreter.ts`) actually runs the generated Java for the subset Koudo supports: variable declarations, `println`, assignment/`++`/`--`, arithmetic and comparisons, and `for` loops — with correct `int` vs `double` semantics (`7/2` truncates to `3`, like real Java) and a runaway-loop guard. Hit **Run** (or `Alt+Shift+R`) — disabled until the flowchart has a *connected* End block — and the Output panel shows what actually printed.

### Everything else

- Dark/light mode (`Alt+Shift+T`), auto-detected from OS preference, persisted
- Resizable panel layout (flowchart / code / output), persisted to `localStorage`
- "New" clears the canvas back to a single Start block, behind a confirmation

### Not built yet

- Save/Load a project, Export `.java`/`.json` — the New/Open/Save/Export buttons exist in the top bar, but only New is wired up
- Functional For Loop / While Loop (real code generation + interpreter support)
- Functional if/else code generation and execution for Decision — the block exists and branches visually; generating real `if (...) { } else { }` Java and interpreting it is still open
- Onboarding/tutorial
- Nested loops, arrays, Scanner input — see `UI_DESIGN.md` for the fuller aspirational UI, further out than any of the above

## Tech stack

- **Svelte 5** + **Vite** — small bundle, fast dev loop
- **[@xyflow/svelte](https://svelteflow.dev/)** — the flowchart canvas
- **Monaco Editor** — the code panel
- **Tailwind CSS v4** — styling
- Zero backend — everything, including code execution, runs client-side; nothing is sent anywhere

### Why no real JVM?

GraalVM doesn't run client-side in a browser. CheerpJ/Doppio (a real JVM-in-WASM) mean tens of MB of runtime download, slow cold start, and (for CheerpJ) commercial licensing — overkill for a beginner subset that's just loops, branches, `println`, and variables. A backend sandbox (Judge0/Piston/self-hosted) breaks the browser-only, zero-hosting-cost architecture and adds a code-execution security surface. A small custom interpreter — reusing the same restricted-subset AST the flowchart parser already needs — gives instant execution, full control over step-by-step trace granularity (the point of the Loop Tracer), and no arbitrary-code-execution risk, since it only understands the subset Koudo defines.

## Getting started

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # outputs to dist/
npm run check   # svelte-check + tsc
```

Deploys automatically to GitHub Pages on every push to `main` (see `.github/workflows/deploy.yml`).

## Project structure

```
src/
├── App.svelte                       top-level layout: navbar, resizable panels
├── components/
│   ├── Flowchart/
│   │   ├── FlowchartCanvas.svelte       SvelteFlow provider wrapper
│   │   ├── FlowchartBoard.svelte        canvas: drag/drop, connect, Arrange, context menu
│   │   ├── BlockPalette.svelte          draggable block chips
│   │   ├── DeclareNode.svelte           Variable block (custom node)
│   │   ├── ProcessNode.svelte           Output block (custom node, parallelogram)
│   │   ├── DecisionNode.svelte          Decision block (custom node, diamond, 2 handles)
│   │   ├── ShapeFrame.svelte            shared clip-path "shape + border" helper
│   │   └── CanvasContextMenu.svelte     right-click Duplicate/Delete
│   ├── CodeEditor/
│   │   └── JavaCodeEditor.svelte        Monaco wrapper, two-way synced
│   ├── LoopTracer/
│   │   ├── LoopIterationPanel.svelte    step-through loop trace (mocked data)
│   │   └── OutputPanel.svelte           Run button's real console output
│   └── Common/
│       ├── TopNavbar.svelte
│       └── ThemeToggle.svelte
├── stores/
│   ├── flowchart.ts    nodes/edges + every node-shape/connect/merge rule
│   ├── code.ts          Monaco's text content
│   ├── sync.ts           the two-way flowchart <-> code reconciliation
│   ├── run.ts            wires the interpreter to the Run button + Output panel
│   └── theme.ts
└── lib/
    ├── flowchart/
    │   ├── generator.ts           flowchart -> Java
    │   ├── declarationParser.ts   Java -> declarations
    │   └── statementParser.ts     Java -> statements
    ├── execution/
    │   ├── interpreter.ts         the real (small) Java interpreter
    │   └── loopTracer.ts          mocked trace data for LoopIterationPanel
    └── storage/
        └── layoutPrefs.ts         persisted panel sizes
```

## License

MIT — see [LICENSE](./LICENSE).

---

Made with ❤️ for beginners who want to understand loops (and now branches) 🚀
