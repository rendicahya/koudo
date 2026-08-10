# 💻 KOUDO - Java Flowchart ↔ Code Sync Educator
**Koudo** (コード - "Code" in Japanese Katakana)  
**Tagline:** "Koudo - Your code story"

---

### Why KOUDO?
- **コード** (Katakana) = "code" (direct, clear, simple)
- Santai & modern Japanese tech vibe (non-English)
- Direct reference to core concept: "Code"
- Perfect for programming context
- Easy to pronounce internationally: KO-u-do
- Simple, memorable, short
- Modern katakana aesthetic (tech/programming feel)

**Domain:** koudo.dev, koudo.io  
**GitHub:** github.com/user/koudo  
**Logo:** Modern code brackets { } with flowing lines

---

## 📋 PROJECT VISION

**Koudo** adalah web app edukatif yang membantu absolute beginners memahami pemrograman Java, khususnya **looping** (for-loop, while, do-while) melalui visualisasi flowchart yang sync real-time dengan kode Java.

### Target User
- Absolute beginners (belum pernah coding)
- Frustrated dengan abstract looping concepts
- Visual learners yang butuh connection: diagram ↔ code

### Core Problem It Solves
Mayoritas pemula bingung dengan loop karena:
- Tidak paham eksekusi berjalan berapa kali
- Tidak lihat real-time apa yang dijalankan
- Tahu syntax tapi tidak "feel" logic-nya

**Koudo solves:** Visual 2-way bridge yang membuat loop logic *obvious*.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Frontend Stack
- **Framework:** Svelte (reactive, small bundle, fast development)
- **Flowchart Visualization:** SvelteFlow (port from Reactflow)
- **Code Editor:** Monaco Editor (VS Code-like UX)
- **Styling:** Tailwind CSS + custom CSS for dark/light
- **State Management:** Svelte stores (reactive, minimal boilerplate)
- **Build Tool:** Vite (blazing fast)

### Browser-Only (No Backend Required)
- Pure client-side app
- localStorage for auto-save & recent projects
- JSON format for export/import

### ⚙️ Execution Engine Decision
**Chosen: Custom lightweight interpreter (TypeScript), NOT a real JVM.**

Rejected options and why:
- **GraalVM / CheerpJ / Doppio (real JVM in browser):** GraalVM doesn't actually run client-side in a browser — that's a misconception from earlier drafts. Even CheerpJ/Doppio (real JVM-in-WASM) mean tens of MB of runtime download, slow cold start, and (for CheerpJ) commercial licensing — all overkill for a beginner subset that's just loops + println + Scanner.
- **Backend sandbox (Judge0/Piston/self-hosted):** breaks the browser-only architecture, adds hosting cost and code-execution security surface, and doesn't fit static GitHub Pages hosting.

Why a custom interpreter wins:
- Instant execution, no runtime download — matches the "small bundle, fast" rationale for picking Svelte.
- Reuses the same restricted-subset AST that `parser.ts` already needs for code→flowchart — no duplicate work.
- Full control over step-by-step trace granularity (i=0, i=1, ...), which is exactly what the Loop Tracer (the core USP) needs. A real JVM makes this harder, not easier.
- No arbitrary-code-execution risk, since the interpreter only understands the subset we define.

**Sequencing:** Priority right now is shipping the Loop-learning **UI** first. Until the interpreter exists, `execution.ts` / `loopTracer.ts` can run on **mocked/hardcoded trace data** (canned iteration arrays matching what a for-loop's UI should display) so the UI/UX can be built and validated. The real interpreter is a separate milestone that plugs into the same store interface once the UI is proven.

---

## 🎨 COMPONENT STRUCTURE

```
src/
├── routes/
│   ├── +page.svelte (main editor canvas)
│   └── +layout.svelte (top nav, dark/light toggle)
├── components/
│   ├── Flowchart/
│   │   ├── FlowchartCanvas.svelte (SvelteFlow wrapper)
│   │   ├── FlowchartNode.svelte (reusable node component)
│   │   ├── BlockPalette.svelte (drag-drop block library)
│   │   └── NodeContextMenu.svelte (right-click actions)
│   ├── CodeEditor/
│   │   ├── JavaCodeEditor.svelte (Monaco wrapper)
│   │   ├── SyntaxValidator.svelte (error display)
│   │   └── CodeHighlight.svelte
│   ├── LoopTracer/
│   │   ├── LoopIterationPanel.svelte ⭐ KEY FEATURE
│   │   ├── VariableState.svelte (current var values)
│   │   └── ExecutionStepControls.svelte (play/pause/step)
│   ├── Common/
│   │   ├── TopNavbar.svelte
│   │   ├── ThemeToggle.svelte
│   │   ├── SaveDownloadPanel.svelte
│   │   └── ProjectList.svelte (recent projects)
│   └── Tutorial/
│       └── OnboardingModal.svelte
├── stores/
│   ├── flowchart.ts (flowchart state: nodes, edges)
│   ├── code.ts (code content, parse results)
│   ├── sync.ts (sync state between flowchart ↔ code)
│   ├── theme.ts (dark/light mode)
│   └── execution.ts (loop execution trace state)
├── lib/
│   ├── flowchart/
│   │   ├── parser.ts (parse code → flowchart)
│   │   ├── generator.ts (flowchart → code)
│   │   └── validator.ts (code validation)
│   ├── storage/
│   │   ├── localStorage.ts (save/load projects)
│   │   └── export.ts (download .java, .json, .zip)
│   ├── execution/
│   │   ├── loopTracer.ts ⭐ (trace loop iterations)
│   │   └── variableState.ts (track var values)
│   └── constants.ts
└── styles/
    ├── global.css
    └── theme.css (dark/light variables)
```

---

## 🔄 DATA FLOW

### Flowchart-to-Code Flow
```
User drags block → FlowchartCanvas update
    ↓
flowchart store updates (nodes/edges)
    ↓
sync store detects change
    ↓
generator.ts converts to Java code
    ↓
code.ts updates (includes auto-formatting)
    ↓
Monaco Editor re-renders
    ↓
LoopIterationPanel updates ("This runs 5 times")
```

### Code-to-Flowchart Flow
```
User types/pastes code → Monaco Editor
    ↓
code store updates (debounced 500ms)
    ↓
validator.ts checks syntax
    ↓
parser.ts converts to AST
    ↓
flowchart store updates (nodes/edges)
    ↓
SvelteFlow re-renders
    ↓
LoopIterationPanel updates trace info
```

---

## ⭐ LOOP EMPHASIS FEATURES (THE HEART)

### Feature 1: Loop Iteration Counter Badge
**Where:** On every Loop node in flowchart
**Shows:** `10x` or `for i=0; i<10; i++`
**Updates:** Real-time as user edits

```svelte
<!-- Loop node shows: -->
<div class="loop-badge">
  <span class="count">10x</span>
  <span class="range">(i=0 → 9)</span>
</div>
```

### Feature 2: "How Many Times?" Panel
**Where:** Bottom-right, always visible
**Shows:** "This code block runs 10 times in the loop"
**Updates:** When hovering over loop or code inside loop

```
┌─────────────────────────────────┐
│  LOOP TRACER PANEL              │
├─────────────────────────────────┤
│ FOR LOOP (i = 0 to 9):          │
│ ✓ Initialization: int i = 0     │
│ ✓ Condition: i < 10             │
│ ✓ Increment: i++                │
│                                 │
│ CODE INSIDE RUNS: 10 times      │
│ Current iteration: (click play) │
└─────────────────────────────────┘
```

### Feature 3: Step-by-Step Execution Tracer
**Where:** LoopIterationPanel (opens in modal)
**Shows:**
- Play button → execute loop step-by-step
- Current iteration: i=0, i=1, i=2...
- Variable values: `i: 0`, `i: 1`, `i: 2`...
- Output: What prints in each iteration

```
Iteration 1: i = 0
  print("i is: 0")
  → Output: "i is: 0"

Iteration 2: i = 1
  print("i is: 1")
  → Output: "i is: 1"
```

### Feature 4: Auto-Comments Generation
When code is generated from flowchart, automatically add comments:
```java
// Loop runs 10 times (i from 0 to 9)
for (int i = 0; i < 10; i++) {
    System.out.println("Iteration: " + i);  // Runs 10 times
}
```

---

## 💾 PROJECT PERSISTENCE

### Save Format: JSON
```json
{
  "name": "My First Loop Project",
  "version": "1.0",
  "createdAt": "2026-08-07T10:30:00Z",
  "flowchart": {
    "nodes": [...],
    "edges": [...]
  },
  "code": {
    "java": "for (int i=0; i<10; i++) { ... }",
    "metadata": {
      "loopCount": 1,
      "hasNesting": false
    }
  }
}
```

### Download Options
1. **Export as .java** - Just the code file
2. **Export as .json** - Flowchart + code metadata
3. **Export as .zip** - Complete project bundle

### Upload/Load
- Drag-drop .json file onto canvas
- Recent projects sidebar (max 5, stored in localStorage)
- Clear projects button (with confirmation)

---

## 🎨 UI/UX DESIGN PRINCIPLES

### Dark/Light Mode
**Light Mode:**
- Background: Clean white (#FFFFFF)
- Canvas: Light gray (#F5F5F5)
- Flowchart nodes: White with blue borders
- Text: Dark gray (#333333)
- Accents: Bright blue (#0066FF)

**Dark Mode:**
- Background: Dark navy (#0A0E27)
- Canvas: Darker gray (#1A1F3A)
- Flowchart nodes: Dark gray with light blue borders
- Text: Light gray (#E0E0E0)
- Accents: Bright cyan (#00D9FF)

### Responsive Layout
**Desktop (>1024px):**
- Flowchart panel: 50% width (left)
- Code editor: 50% width (right)
- Resizable divider between them

**Tablet (768px - 1023px):**
- Stacked layout: Flowchart top, Code bottom
- Tab switcher for quick toggle

**Mobile (<768px):**
- Full-width toggle between Flowchart/Code views
- Adjusted node size for touch targets

---

## 🚀 MVP FEATURES (Phase 1)

**Priority order: UI first.** The Loop-learning UI (flowchart canvas, code editor, Loop Tracer panel) gets built and validated before the real execution engine exists — see [Execution Engine Decision](#-execution-engine-decision). Trace data can be mocked/hardcoded until the interpreter is ready.

**In Scope (functional):**
- Flowchart builder: Start, End, Process, For Loop nodes
- Code generator: Flowchart → Java (for-loops only)
- Code parser: Java → Flowchart (limited, for-loops only)
- Loop Tracer panel with iteration counting (mocked data first, then real interpreter)
- Step-by-step execution (for-loops only)
- Save/Load projects (JSON)
- Export .java code
- Dark/light mode toggle
- Local storage (auto-save every 30s)
- Tutorial onboarding (skippable)

**In Scope (UI only, not functionally wired yet):**
- Decision/While Loop nodes may appear in the block palette for visual completeness, but don't need working parse/generate/trace logic in Phase 1 — dragging them in can be a visible "coming soon" state.

**Out of Scope (Phase 2):**
- While/do-while loops (functional parse/generate/trace)
- If-else/switch visualization (functional)
- Nested loops
- Function/method blocks
- Array iteration
- Execution playback animation
- Export flowchart as image
- Collaborative editing
- Cloud sync
- Account/auth system

---

## 📝 STATE MANAGEMENT (Svelte Stores)

### flowchart.ts
```typescript
export const nodes = writable<FlowNode[]>([]);
export const edges = writable<FlowEdge[]>([]);

export const addNode = (type: 'start'|'end'|'process'|'loop'|'decision') => {...}
export const deleteNode = (nodeId: string) => {...}
export const updateNode = (nodeId: string, data: any) => {...}
```

### code.ts
```typescript
export const codeContent = writable<string>('');
export const codeError = writable<ParseError | null>(null);
export const parseResult = writable<AST | null>(null);

export const parseCode = (content: string) => {...}
export const formatCode = (content: string) => {...}
```

### execution.ts
```typescript
export const currentIteration = writable<number>(0);
export const loopVariables = writable<Record<string, any>>({});
export const executionOutput = writable<string[]>([]);
export const isTracing = writable<boolean>(false);

export const traceLoop = (loopCode: string) => {...}
export const nextIteration = () => {...}
export const resetExecution = () => {...}
```

---

## 🧪 VALIDATION & ERROR HANDLING

### Code Validation Strategy
- Real-time syntax check (red squiggly in editor)
- Validation only: NO execution in MVP
- Clear error messages: "Unexpected token on line 5"
- Suggestion hints: "Did you mean 'for' instead of 'FOR'?"

### Flowchart Validation
- Warn if no Start block
- Warn if no End block
- Error if orphaned blocks (not connected)
- Require loop counter variable initialization
- Auto-connect new edges with defaults

---

## 📦 DEPLOYMENT (GitHub Pages)

### Repo Structure
```
github.com/rendicahya/koudo/
├── src/ (source code)
├── public/ (static assets)
├── package.json
├── svelte.config.js
├── vite.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml (auto-deploy to GitHub Pages)
└── README.md
```

### Build & Deploy
```bash
npm run build  # Vite outputs to dist/
# GitHub Actions auto-deploys dist/ to gh-pages branch
# Live at: rendicahya.github.io/koudo/
```

---

## 🎯 KEY IMPLEMENTATION PRIORITIES

### Priority 0: Loop-Learning UI (build this first)
- Flowchart canvas + code editor side-by-side, Loop Tracer panel wired to **mocked trace data**
- Goal: validate the UX (does seeing "runs 10 times" + step-through actually make loops click?) before investing in a real interpreter

### Priority 1: Loop Tracer Panel (real data)
- Swap mocked trace data for the real custom interpreter (see Execution Engine Decision)
- Step-by-step execution showing iteration count
- Variable state tracking (current i value)
- This is what makes Koudo unique

### Priority 2: 2-Way Sync
- Flowchart → Code generation (reliable)
- Code → Flowchart parsing (start simple: for-loops only)

### Priority 3: UX Polish
- Smooth animations (node drag, transitions)
- Clear error messages
- Intuitive node editing (double-click to edit)

### Priority 4: Save/Load
- localStorage auto-save
- Export .java (simple text file)
- Import from file

---

## 💡 VIBE & TONE

**For Users:**
- Encouraging, non-judgmental ("Everyone finds loops confusing! You're not alone!")
- Visual-first (show before telling)
- Fun & casual tone (no jargon overload)
- Celebrate small wins ("Loop executed 5 times! 🎉")
- Tutorial is optional (power users can skip)
- Friendly language throughout (avoid corporate speak)

**For Code:**
- Svelte's reactivity = less boilerplate
- Functional, composable stores
- Clear naming: `parseCodeToFlowchart`, not `pc2fc`
- Comments on tricky logic (code parsing, sync detection)

---

## 🔍 TESTING STRATEGY (Future)

- Unit tests: Parser, generator, validator
- E2E tests: Create project → edit → save → load
- Manual QA: Dark/light mode, all browsers, mobile

---

## 📚 RESOURCES & REFERENCES

- [Svelte Docs](https://svelte.dev)
- [SvelteFlow GitHub](https://github.com/xyflow/svelteflow)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS](https://tailwindcss.com)
- [Java AST Parsing](https://www.npmjs.com/package/java-parser)

---

## 🎬 NEXT STEPS (AFTER APPROVING THIS DOCUMENT)

1. **Create GitHub repo** with Svelte + Vite scaffold
2. **Set up project structure** (components, stores, lib folders)
3. **Build basic UI** (navbar, flowchart canvas, code editor side-by-side)
4. **Build flowchart builder UI** (drag-drop blocks, For Loop node with badge)
5. **Build Loop Tracer panel UI** wired to **mocked trace data** — validate the learning UX first
6. **Dark/light mode** (Tailwind + theme toggle)
7. **Implement code generator** (flowchart → Java code, for-loops only)
8. **Implement code parser** (Java → flowchart, for-loops only)
9. **Implement the real custom interpreter**, swap out the mocked trace data in the Loop Tracer
10. **Add save/load** (localStorage + export)
11. **Tutorial & polish** (UX refinements)
12. **Deploy to GitHub Pages**

---

**Made with ❤️ for Beginners Who Want to Understand Loops**

Happy coding! 🚀
