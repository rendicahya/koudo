# 💻 KOUDO — コウド

Koudo is a browser-only educational web app that helps absolute beginners learn programming — not just loops — by keeping a flowchart and real Java code in sync, live, in both directions. Build a flowchart and watch the Java code write itself, or type Java and watch the flowchart build itself, then hit **Run** (or step through it one line at a time) and watch a real interpreter actually execute it, with every variable's value visible as it changes.

> **コウド** — a Japanese-katakana rendering of "Koudo," playing on コード ("code" as a loanword). Direct, simple, easy to say internationally.

Live: https://rendicahya.github.io/koudo/ (auto-deployed from `main`)

## Why

Beginners get stuck on programming fundamentals — variables, input/output, sequencing, decisions, and yes, eventually loops — because they can't see execution happen: they know the syntax but don't "feel" what the computer is actually doing, in what order, to which values. Koudo makes that visible from day one. Every block on the canvas is a real, teachable programming concept (declare a variable, read input, print output, branch on a condition), each one becomes real Java as you build, and **Step Through** lets a beginner watch their program run one line at a time, with a live table of every variable's current value right next to it.

## Status

Koudo is a work in progress. What's functional today:

### Flowchart ↔ code, both directions

- **Start** / **End** — terminal blocks, singleton (the palette disables each once one already exists)
- **Variable** (Declare) — declares a variable. Drag another Variable block onto the bottom of the flow (or click **+ Add variable** on the block itself) to merge multiple declarations into one block, each producing its own line. What the block asks for depends on the active **variable mode** (see below): a type-and-value pair in Standard mode, or just a value — its type inferred automatically — in Beginner mode. Drag a row's ⠿ handle to reorder it within the block (declaration order matters to Java), and check its box to make it a `final` constant
- **Assign** — change a variable already in scope (`=`, `+=`, `-=`, `*=`, `/=`), same multi-row merge pattern
- **Input** — reads a value from the user into a variable, with an optional prompt; the right `Scanner` method (`nextInt`/`nextDouble`/`nextBoolean`/`next`) is picked automatically from the variable's declared type
- **Output** (println) — pick a variable to print from a dropdown, shaped as a parallelogram per flowchart convention. Same merge-or-add-another-line behavior as Variable
- **Decision** (if/else) — a real branching block: a diamond with a condition field and two independently-wireable handles (**True** / **False**), each allowed its own outgoing edge, generating real `if (...) { } else { }` Java
- **For Loop** — a hexagonal "Preparation" block with init/condition/update fields side by side, generating a real `for (...) { }`. Its **loop** handle leads into the body, wired back onto the block itself to close the loop; **exit** is whatever comes after
- **While Loop** — a diamond with just a condition, generating `while (...) { }`. Same **loop**/**exit** handle pair and loop-back wiring as For Loop
- **Sub Start** / **Call Sub** / **Sub End** — a full sub-flowchart per method: draw a separate, named flow (its own Sub Start → ... → Sub End, disconnected from `main`), give it parameters and an optional return type, then call it from anywhere with **Call Sub** (positional args, optional result variable). Each Sub Start becomes its own `private static` Java method. Hidden from the palette entirely in Beginner Mode — a method signature needs explicit types, which that mode doesn't otherwise teach. Not runnable yet in Run/Step (the interpreter has no notion of methods) — it shows up correctly in the Java tab and Export, but running a flowchart that uses one surfaces a normal parse error

Dragging a new block auto-connects it to whatever's currently at the bottom of the flow — including a Decision/For/While block, onto whichever of its two handles is still free — and dropping one directly into the gap between two already-connected blocks splices it in between them instead. Manually connecting two handles replaces whatever that handle already pointed to. Right-click a block or a connecting line for Duplicate/Delete. **Arrange** (Canvas menu, or `Alt+Shift+A`) snaps everything into one straight, evenly spaced column (branching into side-by-side columns around a Decision), sized to each block's actual rendered height.

Typing directly into the Monaco editor parses back into the flowchart live (variable declarations and simple statements), without fighting your cursor position or losing focus mid-keystroke. A second **Pseudocode** tab next to Java shows the same program as plain structured-English pseudocode (`DECLARE`/`INPUT`/`OUTPUT`/`IF...THEN...ELSE`/`FOR`/`WHILE`) — generated straight from the flowchart, read-only.

### Language

Switchable from the **Preferences** menu, persisted locally: **English** (default) or **Bahasa Indonesia**. Translates the app's UI chrome — menus, buttons, tooltips, the Help guide, and every block's own field labels/placeholders. Left untranslated on purpose: Java type keywords, `true`/`false`, generated Java/Pseudocode output, and Start/End's own on-canvas text (a fixed label baked in at creation time, not read reactively — see `stores/i18n.ts`'s comment for why).

### Two variable modes, for different levels of beginner

Switchable from the **Preferences** menu, persisted locally:

- **Standard Mode** (default) — the traditional way: pick a type explicitly, value optional
- **Beginner Mode** — declaring a variable just needs a value; its type (`int`/`double`/`boolean`/`String`) is inferred from what's typed, so a first-time learner never has to know Java's type names before they can use a variable. A value isn't required either — leave it blank and pick the type from a plain-language picker (Whole number / Text / Decimal number) instead

### Real execution, not mocked

A small hand-written interpreter (`src/lib/execution/interpreter.ts`) actually runs the generated Java for the subset Koudo supports: variable declarations, `println`/`print`, assignment/compound-assignment/`++`/`--`, arithmetic and comparisons, `if`/`else`, `for` and `while` loops, and `Scanner` input (via a browser prompt) — with correct `int` vs `double` semantics (`7/2` truncates to `3`, like real Java) and a runaway-loop guard. Hit **Run** (or `Alt+Shift+R`) — disabled until the flowchart has a *connected* End block — and the Output panel shows what actually printed.

### Step-by-step execution and the Variable Watcher

**⏭ Step** (or `Alt+Shift+S`) runs the program one line at a time instead of all at once, highlighting whichever block is currently executing on the canvas. Each line gets its own click and stays on that block — a print's output, or a newly declared/assigned variable, shows up *while its block is still highlighted*, not only after the playhead has already moved on. A Declare/Assign/Output/Input block holding several lines gets a small **▶** arrow next to whichever of its rows is currently running, plus a floating badge on the canvas and a line indicator in the Output panel (`Line 2/3: ...`); a Decision evaluates its condition and follows whichever branch is actually taken. **▶ Run**, **⏭ Step**, and **⏹ Stop** all live in a toolbar above the Output panel (Stop disabled until a run is active), and a live **Variable Watcher** table sits next to the Output panel throughout, showing every variable currently in scope and its value, updated after every single step.

### A guided first run

A first-time visitor sees a welcome modal (pick English or Bahasa Indonesia, then **Start Tutorial** or **Skip**) before ever touching the canvas, which starts the **Basic** guide: declare a variable, print it with Output, tidy the layout with Canvas → Arrange, and hit Run. The tutorial is a step-by-step coach panel — drag-to-move, highlighting whichever palette chip or button each step calls for. Five more guides are reachable any time from **Help → Tutorial**: Variables/Constants/Assignment (a `final` constant and a circle-area calculation), Input & Output, Decision (If), For Loop, and While Loop.

### Autosave, Undo/Redo, and save/load

Every edit — including a whole block drag, treated as one step — is saved to `localStorage` automatically and undoable with `Ctrl+Z`/`Ctrl+Shift+Z` (or the ↶/↷ buttons, top-left). **Save Project** downloads the flowchart as a minified `.kdo` (JSON) file; **Open Project** loads one back onto the canvas, behind a confirmation.

### 8 themes + System

The ☀️/🌙 button (top-right, `Alt+Shift+T` quick-toggles) picks from 4 light and 4 dark palettes (Default/Warm/Cool/Nature) or **System**, which tracks the OS's `prefers-color-scheme` live. Every block, menu, and the Java editor's own Monaco theme follow whichever is active.

### Mobile-friendly

Below a tablet-width breakpoint, the flowchart/code/output split gives way to three full-height tabs — Flowchart, Pseudocode, Java — so editing a flowchart on a phone isn't squeezed into a fraction of a short screen.

### Everything else

- **Help** menu — **Guide**, an in-app usage guide covering blocks, running, the code panel, variable modes, menus, and keyboard shortcuts; and **Tutorial**, to replay the guided walkthrough above
- **Project** menu — New / Open Project / Save Project (a `.kdo` file), **Export Java** (downloads the generated code as a real, compilable `Main.java`), and **Export Pseudocode** (downloads the same program as a `.txt`)
- **Preferences** menu — variable mode, language, code indent (2/4 spaces or tab), and code font (several self-hosted monospace webfonts, plus system-only Consolas)
- **Canvas** menu — Arrange, and Download PNG (rasterizes the flowchart as-is)
- An editable **project name** next to the KOUDO logo (defaults to "Untitled Project"), click to rename. Carried through Save/Open (round-trips in the `.kdo` file) and used to name Save/Export Pseudocode/Download PNG's downloaded files; reset to the default on New. Export Java always stays `Main.java`, since a compilable file's public class name has to match its filename
- Input and Output blocks default their dropdown to the topmost declared variable as soon as they're placed, instead of an unset "choose" placeholder
- The code panel remembers which tab (Java or Pseudocode) you last had open, persisted to `localStorage` — Pseudocode is the default for a first-time visitor
- Independent zoom controls (−/+) for the code panel (Java + Pseudocode together) and the Output panel, both persisted to `localStorage`; a **Copy** button (📋) copies whichever code tab is currently open to the clipboard
- A fullscreen toggle (⛶, top-right)
- Non-blocking toast warnings — e.g. dropping an Input or Assign block before any variable's been declared — instead of a blocking `alert()`
- A hover "lift" effect on every block, not just Start/End
- Hide/show the code panel from a toggle on the divider between it and the canvas, to give the flowchart more room
- Minimizable, enlarged block palette
- Resizable panel layout (flowchart / code / output), persisted to `localStorage`
- "New" clears the canvas back to a single Start block, behind a confirmation

### Not built yet

- Arrays, classes — anything past this single-class, beginner-first subset
- Running/stepping a flowchart that calls a Subroutine (Java/Export/Pseudocode already support it — see Sub Start/Call Sub/Sub End above)

## Tech stack

- **Svelte 5** + **Vite** — small bundle, fast dev loop
- **[@xyflow/svelte](https://svelteflow.dev/)** — the flowchart canvas
- **Monaco Editor** — the code panel
- **html-to-image** — rasterizes the canvas for the PNG export
- **Tailwind CSS v4** — styling
- **@fontsource/\*** — self-hosted code webfonts for the Preferences menu's font picker
- Zero backend — everything, including code execution, runs client-side; nothing is sent anywhere

### Why no real JVM?

GraalVM doesn't run client-side in a browser. CheerpJ/Doppio (a real JVM-in-WASM) mean tens of MB of runtime download, slow cold start, and (for CheerpJ) commercial licensing — overkill for a beginner subset that's just variables, I/O, branches, and loops. A backend sandbox (Judge0/Piston/self-hosted) breaks the browser-only, zero-hosting-cost architecture and adds a code-execution security surface. A small custom interpreter — reusing the same restricted-subset AST the flowchart parser already needs — gives instant execution, full control over step-by-step trace granularity (the point of Step Through and the Variable Watcher), and no arbitrary-code-execution risk, since it only understands the subset Koudo defines.

## Getting started

```bash
npm install
npm run dev     # http://localhost:5173/koudo/ (Vite picks the next free port if 5173 is busy)
npm run build   # outputs to dist/
npm run check   # svelte-check + tsc
```

Deploys automatically to GitHub Pages on every push to `main` (see `.github/workflows/deploy.yml`).

## Project structure

```
src/
├── App.svelte                       top-level layout: navbar, resizable panels, mobile tabs, SvelteFlowProvider
├── components/
│   ├── Flowchart/
│   │   ├── FlowchartCanvas.svelte       thin canvas wrapper
│   │   ├── FlowchartBoard.svelte        drag/drop, connect, smart mid-chain insertion, context menu
│   │   ├── BlockPalette.svelte          draggable block chips, minimizable
│   │   ├── DeclareNode.svelte           Variable block (custom node) — mode-aware, drag-to-reorder, const
│   │   ├── AssignNode.svelte            Assign block (custom node)
│   │   ├── InputNode.svelte             Input block (custom node, parallelogram)
│   │   ├── ProcessNode.svelte           Output block (custom node, parallelogram)
│   │   ├── DecisionNode.svelte          Decision block (custom node, diamond, 2 handles)
│   │   ├── ForLoopNode.svelte           For Loop block (custom node, hexagon, 2 handles)
│   │   ├── WhileLoopNode.svelte         While Loop block (custom node, diamond, 2 handles)
│   │   ├── SubroutineStartNode.svelte   Sub Start block — name/params/return type
│   │   ├── SubroutineCallNode.svelte    Call Sub block — target/args/result variable
│   │   ├── SubroutineEndNode.svelte     Sub End block — optional return value
│   │   ├── ShapeFrame.svelte            shared clip-path "shape + border" helper
│   │   └── CanvasContextMenu.svelte     right-click Duplicate/Delete
│   ├── CodeEditor/
│   │   ├── CodeEditorPanel.svelte       Java/Pseudocode tab bar
│   │   ├── JavaCodeEditor.svelte        Monaco wrapper, two-way synced
│   │   └── PseudocodeView.svelte        read-only pseudocode, derived from the flowchart
│   ├── Output/
│   │   └── OutputPanel.svelte           Run/Step/Stop, output (own zoom), Variable Watcher, Clear
│   └── Common/
│       ├── TopNavbar.svelte             project name, Undo/Redo, Project/Canvas/Preferences/Help menus
│       ├── ProjectMenu.svelte           New/Open/Save (.kdo), Export Java/Pseudocode
│       ├── CanvasMenu.svelte            Arrange, Download PNG
│       ├── PreferencesMenu.svelte       Mode/Language/Code flyout submenus
│       ├── HelpMenu.svelte              Guide + Tutorial (6-guide flyout) menu
│       ├── HelpModal.svelte             in-app usage guide (tabs in help/)
│       ├── TutorialWelcomeModal.svelte  first-visit language pick + Start/Skip
│       ├── TutorialCoach.svelte         draggable step-by-step tutorial panel + palette highlight
│       ├── Toast.svelte                 non-blocking warning banner
│       ├── ThemeToggle.svelte           theme picker dropdown (4 light + 4 dark + System)
│       └── FullscreenToggle.svelte
├── stores/
│   ├── flowchart.ts     nodes/edges + every node-shape/connect/merge/insertion rule
│   ├── code.ts           Monaco's text content
│   ├── sync.ts            the two-way flowchart <-> code reconciliation
│   ├── run.ts             wires the interpreter to the Run button + Output panel
│   ├── stepRunner.ts      the step-by-step runner + Variable Watcher state
│   ├── settings.ts        Beginner/Standard variable-mode setting, persisted
│   ├── toast.ts           non-blocking warning messages
│   ├── layout.ts          code/output panel state, active code tab, font sizes (all persisted)
│   ├── i18n.ts            language setting (persisted) + the reactive $t() lookup
│   ├── project.ts         the editable project name (not persisted — see New/Open/Save)
│   ├── theme.ts           8-palette + System theme, resolves to a live data-theme value
│   ├── history.ts         debounced/batched Undo/Redo over the flowchart
│   ├── autosave.ts        localStorage persistence of the current flowchart
│   └── tutorial.ts        welcome-modal + step-coach state, step content/highlight tables
└── lib/
    ├── flowchart/
    │   ├── generator.ts             flowchart -> Java (main body + per-Subroutine methods)
    │   ├── generatorPseudocode.ts   flowchart -> pseudocode
    │   ├── declarationParser.ts     Java -> declarations
    │   ├── statementParser.ts       Java -> statements
    │   ├── typeInference.ts         Beginner mode's value -> type inference
    │   ├── valueFormat.ts           Declare/Assign value <-> Java literal quoting
    │   ├── graphWalk.ts             shared edge-walking helpers (branches, upstream vars, subroutine scope)
    │   ├── exportJava.ts            wraps generated code + methods into a compilable Main.java
    │   └── exportPng.ts             flowchart -> PNG data URL
    ├── execution/
    │   ├── tokenizer.ts, parser.ts   the interpreter's own small lexer/parser
    │   └── interpreter.ts            the real (small) Java interpreter, run-all and step-by-step
    ├── i18n/
    │   └── translations.ts        English/Indonesian UI text, keyed the same in both
    ├── storage/
    │   ├── layoutPrefs.ts         persisted panel sizes
    │   └── flowchartFile.ts       flowchart <-> Save/Open Project (.kdo) JSON
    └── download.ts                 shared "download this as a file" helper
```

## License

MIT — see [LICENSE](./LICENSE).

---

Made with ❤️ for beginners learning to code 🚀
