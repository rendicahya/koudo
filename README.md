# 💻 KOUDO — コウド

**Your code story.**

Koudo is a browser-only educational web app that helps absolute beginners learn programming — not just loops — by keeping a flowchart and real Java code in sync, live, in both directions. Build a flowchart and watch the Java code write itself, or type Java and watch the flowchart build itself, then hit **Run** (or step through it one line at a time) and watch a real interpreter actually execute it, with every variable's value visible as it changes.

> **コウド** — a Japanese-katakana rendering of "Koudo," playing on コード ("code" as a loanword). Direct, simple, easy to say internationally.

Live: https://rendicahya.github.io/koudo/ (auto-deployed from `main`)

## Why

Beginners get stuck on programming fundamentals — variables, input/output, sequencing, decisions, and yes, eventually loops — because they can't see execution happen: they know the syntax but don't "feel" what the computer is actually doing, in what order, to which values. Koudo makes that visible from day one. Every block on the canvas is a real, teachable programming concept (declare a variable, read input, print output, branch on a condition), each one becomes real Java as you build, and **Step Through** lets a beginner watch their program run one line at a time, with a live table of every variable's current value right next to it.

## Status

Koudo is a work in progress. What's functional today:

### Flowchart ↔ code, both directions

- **Start** / **End** — terminal blocks, singleton (the palette disables each once one already exists)
- **Variable** (Declare) — declares a variable. Drag another Variable block onto the bottom of the flow (or click **+ Add variable** on the block itself) to merge multiple declarations into one block, each producing its own line. What the block asks for depends on the active **variable mode** (see below): a type-and-value pair in Standard mode, or just a value — its type inferred automatically — in Beginner mode
- **Assign** — change a variable already in scope (`=`, `+=`, `-=`, `*=`, `/=`), same multi-row merge pattern
- **Input** — reads a value from the user into a variable, with an optional prompt; the right `Scanner` method (`nextInt`/`nextDouble`/`nextBoolean`/`next`) is picked automatically from the variable's declared type
- **Output** (println) — pick a variable to print from a dropdown, shaped as a parallelogram per flowchart convention. Same merge-or-add-another-line behavior as Variable
- **Decision** (if/else) — a real branching block: a diamond with a condition field and two independently-wireable handles (**True** / **False**), each allowed its own outgoing edge, generating real `if (...) { } else { }` Java
- **For Loop** — a hexagonal "Preparation" block with init/condition/update fields side by side, generating a real `for (...) { }`. Its **loop** handle leads into the body, wired back onto the block itself to close the loop; **exit** is whatever comes after
- **While Loop** — a diamond with just a condition, generating `while (...) { }`. Same **loop**/**exit** handle pair and loop-back wiring as For Loop

Dragging a new block auto-connects it to whatever's currently at the bottom of the flow — including a Decision/For/While block, onto whichever of its two handles is still free — and dropping one directly into the gap between two already-connected blocks splices it in between them instead. Manually connecting two handles replaces whatever that handle already pointed to. Right-click a block or a connecting line for Duplicate/Delete. **Arrange** (Canvas menu, or `Alt+Shift+A`) snaps everything into one straight, evenly spaced column (branching into side-by-side columns around a Decision), sized to each block's actual rendered height.

Typing directly into the Monaco editor parses back into the flowchart live (variable declarations and simple statements), without fighting your cursor position or losing focus mid-keystroke. A second **Pseudocode** tab next to Java shows the same program as plain structured-English pseudocode (`DECLARE`/`INPUT`/`OUTPUT`/`IF...THEN...ELSE`/`FOR`/`WHILE`) — generated straight from the flowchart, read-only.

### Two variable modes, for different levels of beginner

Switchable from the **Project** menu, persisted locally:

- **Beginner Mode** (default) — declaring a variable just needs a value; its type (`int`/`double`/`boolean`/`String`) is inferred from what's typed, so a first-time learner never has to know Java's type names before they can use a variable
- **Standard Mode** — the traditional way: pick a type explicitly, value optional

### Real execution, not mocked

A small hand-written interpreter (`src/lib/execution/interpreter.ts`) actually runs the generated Java for the subset Koudo supports: variable declarations, `println`/`print`, assignment/compound-assignment/`++`/`--`, arithmetic and comparisons, `if`/`else`, `for` and `while` loops, and `Scanner` input (via a browser prompt) — with correct `int` vs `double` semantics (`7/2` truncates to `3`, like real Java) and a runaway-loop guard. Hit **Run** (or `Alt+Shift+R`) — disabled until the flowchart has a *connected* End block — and the Output panel shows what actually printed.

### Step-by-step execution and the Variable Watcher

**⏭ Step** (or `Alt+Shift+S`) runs the program one line at a time instead of all at once, highlighting whichever block is currently executing on the canvas. Each line gets its own click and stays on that block — a print's output, or a newly declared/assigned variable, shows up *while its block is still highlighted*, not only after the playhead has already moved on. A Declare/Assign/Output/Input block holding several lines gets a small **▶** arrow next to whichever of its rows is currently running, plus a floating badge on the canvas and a line indicator in the Output panel (`Line 2/3: ...`); a Decision evaluates its condition and follows whichever branch is actually taken. **▶ Run**, **⏭ Step**, and **⏹ Stop** all live in a toolbar above the Output panel (Stop disabled until a run is active), and a live **Variable Watcher** table sits next to the Output panel throughout, showing every variable currently in scope and its value, updated after every single step.

### Everything else

- **Help** menu — an in-app usage guide covering blocks, running, the code panel, variable modes, and keyboard shortcuts, for anyone who doesn't want to leave the app to find this README
- **Project** menu — New / Open Project / Save Project, **Export Java** (downloads the generated code as a real, compilable `Main.java`), and the variable-mode switch above. Save Project downloads the flowchart as `.koudo.json`; Open Project loads one back onto the canvas, behind the same confirmation as New
- **Canvas** menu — Arrange, and Download PNG (rasterizes the flowchart as-is)
- Non-blocking toast warnings — e.g. dropping an Input or Assign block before any variable's been declared — instead of a blocking `alert()`
- A hover "lift" effect on every block, not just Start/End
- Hide/show the code panel from a toggle on the divider between it and the canvas, to give the flowchart more room
- Minimizable, enlarged block palette
- Dark/light mode (`Alt+Shift+T`), auto-detected from OS preference, persisted
- Resizable panel layout (flowchart / code / output), persisted to `localStorage`
- "New" clears the canvas back to a single Start block, behind a confirmation

### Not built yet

- Arrays, functions/methods, classes — anything past this single-method, beginner-first subset

## Tech stack

- **Svelte 5** + **Vite** — small bundle, fast dev loop
- **[@xyflow/svelte](https://svelteflow.dev/)** — the flowchart canvas
- **Monaco Editor** — the code panel
- **html-to-image** — rasterizes the canvas for the PNG export
- **Tailwind CSS v4** — styling
- Zero backend — everything, including code execution, runs client-side; nothing is sent anywhere

### Why no real JVM?

GraalVM doesn't run client-side in a browser. CheerpJ/Doppio (a real JVM-in-WASM) mean tens of MB of runtime download, slow cold start, and (for CheerpJ) commercial licensing — overkill for a beginner subset that's just variables, I/O, branches, and loops. A backend sandbox (Judge0/Piston/self-hosted) breaks the browser-only, zero-hosting-cost architecture and adds a code-execution security surface. A small custom interpreter — reusing the same restricted-subset AST the flowchart parser already needs — gives instant execution, full control over step-by-step trace granularity (the point of Step Through and the Variable Watcher), and no arbitrary-code-execution risk, since it only understands the subset Koudo defines.

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
├── App.svelte                       top-level layout: navbar, resizable panels, SvelteFlowProvider
├── components/
│   ├── Flowchart/
│   │   ├── FlowchartCanvas.svelte       thin canvas wrapper
│   │   ├── FlowchartBoard.svelte        drag/drop, connect, smart mid-chain insertion, context menu
│   │   ├── BlockPalette.svelte          draggable block chips, minimizable
│   │   ├── DeclareNode.svelte           Variable block (custom node), mode-aware (Beginner/Standard)
│   │   ├── AssignNode.svelte            Assign block (custom node)
│   │   ├── InputNode.svelte             Input block (custom node, parallelogram)
│   │   ├── ProcessNode.svelte           Output block (custom node, parallelogram)
│   │   ├── DecisionNode.svelte          Decision block (custom node, diamond, 2 handles)
│   │   ├── ForLoopNode.svelte           For Loop block (custom node, hexagon, 2 handles)
│   │   ├── WhileLoopNode.svelte         While Loop block (custom node, diamond, 2 handles)
│   │   ├── ShapeFrame.svelte            shared clip-path "shape + border" helper
│   │   └── CanvasContextMenu.svelte     right-click Duplicate/Delete
│   ├── CodeEditor/
│   │   ├── CodeEditorPanel.svelte       Java/Pseudocode tab bar
│   │   ├── JavaCodeEditor.svelte        Monaco wrapper, two-way synced
│   │   └── PseudocodeView.svelte        read-only pseudocode, derived from the flowchart
│   ├── Output/
│   │   └── OutputPanel.svelte           Run/Step/Stop, output, Variable Watcher, Clear
│   └── Common/
│       ├── TopNavbar.svelte             Project/Canvas menus, Help
│       ├── HelpModal.svelte             in-app usage guide
│       ├── Toast.svelte                 non-blocking warning banner
│       └── ThemeToggle.svelte
├── stores/
│   ├── flowchart.ts     nodes/edges + every node-shape/connect/merge/insertion rule
│   ├── code.ts           Monaco's text content
│   ├── sync.ts            the two-way flowchart <-> code reconciliation
│   ├── run.ts             wires the interpreter to the Run button + Output panel
│   ├── stepRunner.ts      the step-by-step runner + Variable Watcher state
│   ├── settings.ts        Beginner/Standard variable-mode setting, persisted
│   ├── toast.ts           non-blocking warning messages
│   ├── layout.ts          hide/show code panel state
│   └── theme.ts
└── lib/
    ├── flowchart/
    │   ├── generator.ts             flowchart -> Java
    │   ├── generatorPseudocode.ts   flowchart -> pseudocode
    │   ├── declarationParser.ts     Java -> declarations
    │   ├── statementParser.ts       Java -> statements
    │   ├── typeInference.ts         Beginner mode's value -> type inference
    │   ├── valueFormat.ts           Declare/Assign value <-> Java literal quoting
    │   ├── graphWalk.ts             shared edge-walking helpers (branches, upstream vars)
    │   ├── exportJava.ts            wraps generated code into a compilable Main.java
    │   └── exportPng.ts             flowchart -> PNG data URL
    ├── execution/
    │   ├── tokenizer.ts, parser.ts   the interpreter's own small lexer/parser
    │   └── interpreter.ts            the real (small) Java interpreter, run-all and step-by-step
    ├── storage/
    │   ├── layoutPrefs.ts         persisted panel sizes
    │   └── flowchartFile.ts       flowchart <-> Save/Open Project JSON
    └── download.ts                 shared "download this as a file" helper
```

## License

MIT — see [LICENSE](./LICENSE).

---

Made with ❤️ for beginners learning to code 🚀
