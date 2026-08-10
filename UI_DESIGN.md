================================================================================
                    KOUDO - COMPREHENSIVE UI DESIGN
           Java Flowchart ↔ Code Sync Educational Platform
================================================================================

NOTE: This doc shows the full target UI (including Phase 2 ideas like
Scanner input and general runtime errors) so the visual language is
consistent end-to-end. Execution is powered by Koudo's own custom
interpreter, not a real JVM/GraalVM (see CLAUDE.md > Execution Engine
Decision). Build priority is: Loop-learning UI first (with mocked trace
data), for-loop interpreter second, everything marked "Phase 2" later.
================================================================================

================================================================================
1. MAIN APPLICATION LAYOUT (Full Screen)
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  [☰ KOUDO LOGO]                [New] [Open] [Save] [Export]  [🌙] [⚙️]    │
│                                                                              │
├─────────────────────┬──────────────────────────────────────────────────────┤
│                     │                                                       │
│   FLOWCHART PANEL   │              CODE EDITOR PANEL                       │
│   (Left: 35%)       │              (Right: 65%)                            │
│                     │                                                       │
│  ┌────────────────┐ │  ┌───────────────────────────────────────────────┐   │
│  │                │ │  │ for (int i = 0; i < 5; i++) {                │   │
│  │   [●] START    │ │  │   System.out.println(i);                     │   │
│  │      ↓         │ │  │ }                                             │   │
│  │   [◇] FOR      │ │  │                                               │   │
│  │   LOOP         │ │  │ 1      2      3      4      5                 │   │
│  │      ↓         │ │  │                                               │   │
│  │   [▭] PROCESS  │ │  │ [▶ Run]    [⏸ Step Mode]                     │   │
│  │      ↓         │ │  │                                               │   │
│  │   [●] END      │ │  │ Mode: ○ Real-time  ○ Step-through            │   │
│  │                │ │  │                                               │   │
│  │ Block Palette: │ │  │ [Syntax highlighting enabled]                │   │
│  │ ┌──────────────┤ │  │                                               │   │
│  │ │ [+Start]     │ │  └───────────────────────────────────────────────┘   │
│  │ │ [+End]       │ │                                                       │
│  │ │ [+Process]   │ │                                                       │
│  │ │ [+Decision]  │ │                                                       │
│  │ │ [+For Loop]  │ │                                                       │
│  │ │ [+While Loop]│ │                                                       │
│  │ └──────────────┘ │                                                       │
│  │                  │                                                       │
│  │ Properties:      │                                                       │
│  │ ┌──────────────┐ │                                                       │
│  │ │ Selected:    │ │                                                       │
│  │ │ For Loop     │ │                                                       │
│  │ │ Condition: i │ │                                                       │
│  │ │ < 10         │ │                                                       │
│  │ │ [Edit] [Rm] │ │                                                       │
│  │ └──────────────┘ │                                                       │
│  │                  │                                                       │
│  └────────────────┘ │                                                       │
│                     │                                                       │
├─────────────────────┴──────────────────────────────────────────────────────┤
│                                                                              │
│  OUTPUT PANEL (Collapsible/Resizable - Height: 30%)                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [▼ Console]  [▼ Variables]  [▼ Execution]  [▼ Loop Tracer]  [Collapse ◀] │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  === CONSOLE TAB ===                                                 │   │
│  │                                                                       │   │
│  │  0                                                                   │   │
│  │  1                                                                   │   │
│  │  2                                                                   │   │
│  │  3                                                                   │   │
│  │  4                                                                   │   │
│  │                                                                       │   │
│  │  [Clear Output] [Copy] [Download]                                   │   │
│  │                                                                       │   │
│  │ ↕ [Drag to resize]                                                   │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


================================================================================
2. OUTPUT PANEL - TAB VIEWS
================================================================================

--- CONSOLE TAB ---
┌────────────────────────────────────────────────────────────────┐
│ Console Output (max 1000 lines, scrollable)                    │
├────────────────────────────────────────────────────────────────┤
│ 0                                                              │
│ 1                                                              │
│ 2                                                              │
│ 3                                                              │
│ 4                                                              │
│                                                                │
│ ... [Output truncated - 5000+ lines total]                    │
│                                                                │
│ [Clear] [Copy to Clipboard] [Download as .txt]                │
└────────────────────────────────────────────────────────────────┘

--- VARIABLES TAB ---
┌────────────────────────────────────────────────────────────────┐
│ Scanner Input (appears at top when waiting for input)          │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Enter input for Scanner.nextInt():  [___________] [OK]     │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│ Current Variables (live update):                              │
│                                                                │
│ i: int = 2  ← (PULSE ANIMATION - yellow highlight fading)   │
│ count: int = 5                                                │
│ name: String = "John"                                         │
│ isActive: boolean = true                                      │
│                                                                │
│ [Reset Variables]                                             │
└────────────────────────────────────────────────────────────────┘

--- EXECUTION TRACE TAB ---
┌────────────────────────────────────────────────────────────────┐
│ Full Execution History (every line executed)                   │
├────────────────────────────────────────────────────────────────┤
│ Step 1 | Line 1: for (int i=0; i<5; i++)                      │
│ Step 2 | Line 2:   System.out.println(i);    [Output: 0]      │
│ Step 3 | Line 1:   for increment (i++)                        │
│ Step 4 | Line 1:   for condition check (i < 5)               │
│ Step 5 | Line 2:   System.out.println(i);    [Output: 1]      │
│ Step 6 | Line 1:   for increment (i++)                        │
│ Step 7 | Line 1:   for condition check (i < 5)               │
│ ...                                                            │
│ Step 13| Line 1:   for condition check (i < 5) → FALSE        │
│ Step 14| Line 3:   Exit loop                                  │
│                                                                │
│ [Current Step: 5/14]  [Prev Step] [Next Step] [Skip to End]  │
└────────────────────────────────────────────────────────────────┘

--- LOOP TRACER TAB ---
┌────────────────────────────────────────────────────────────────┐
│ Loop Execution Visualization                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Loop: for (int i = 0; i < 5; i++)                            │
│                                                                │
│ Visual Progress:  [●●●○○]                                    │
│ Iteration: 2/4 (0-indexed)                                    │
│ Loop Variable: i = 2                                          │
│ Remaining: 3 iterations                                       │
│                                                                │
│ Iteration Progression:                                         │
│ i=0  →  i=1  →  i=2  ←  i=3  →  i=4  →  Exit               │
│                    ▲                                           │
│                [Current]                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘


================================================================================
3. CODE EDITOR PANEL - DETAILED VIEW
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│ CODE EDITOR (Monaco Editor with Java Syntax Highlighting)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1 │ for (int i = 0; i < 5; i++) {                                         │
│  2 │   System.out.println(i);  ←── [YELLOW HIGHLIGHT] Current Line        │
│  3 │ }                                                                      │
│    │                                                                        │
│  Execution Controls:                                                        │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ [▶ Run]    [⏸ Step]   [⏮ Reset]                            │          │
│  │                                                              │          │
│  │ Mode Selection:                                             │          │
│  │ ○ Real-time Execution (click Run → instant output)         │          │
│  │ ○ Step-through Mode (manual, line-by-line)                │          │
│  │                                                              │          │
│  │ In Step-through Mode:                                       │          │
│  │ [⏮ Reset] [⏭ Next] [⏮⏮ Skip to End]                       │          │
│  │                                                              │          │
│  │ Keyboard Shortcuts (in step mode):                         │          │
│  │ ↓ = Next step                                              │          │
│  │ ↑ = Previous step                                          │          │
│  │                                                              │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  Features:                                                                  │
│  • Syntax highlighting (keywords, strings, comments)                      │
│  • Line numbers                                                            │
│  • Auto-format on paste                                                   │
│  • Undo/Redo                                                               │
│  • Search/Replace (Ctrl+F, Ctrl+H)                                        │
│                                                                              │
│  Syntax Highlighting (Monaco, cosmetic only):                             │
│  • int, double, float, boolean, String                                    │
│  • for, while, if/else                                                     │
│  • System.out.println(), Scanner.*                                        │
│                                                                              │
│  Actually Run/Parsed/Traced (MVP interpreter, for-loops only):            │
│  • int, double, boolean, String declarations                              │
│  • for (init; condition; increment) { ... }                               │
│  • System.out.println()                                                    │
│  • Variable declaration & assignment                                       │
│  (while/if-else/Scanner highlight but don't execute yet — Phase 2)        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


================================================================================
4. FLOWCHART PANEL - DETAILED VIEW
================================================================================

┌──────────────────────────────────────────┐
│ FLOWCHART BUILDER (Drag & Drop)          │
├──────────────────────────────────────────┤
│                                          │
│         Visual Flowchart Blocks:         │
│                                          │
│         ┌─────────┐                      │
│         │ ● START │                      │
│         └────┬────┘                      │
│              │                           │
│         ┌────▼──────┐                    │
│         │ ◇ DECISION │  ← for/while?    │
│         └────┬───┬──┘                    │
│              │   │                       │
│         ┌────▼┐ ┌┴──┐                   │
│         │Proc1│ │Proc2│                 │
│         └────┬┘ └┬───┘                  │
│              │   │                       │
│         ┌────▼───▼──┐                   │
│         │ ● END      │                  │
│         └────────────┘                   │
│                                          │
│ Block Palette (Draggable):               │
│ ┌──────────────────────────────────────┐ │
│ │ [+] START      ┌──────┐              │ │
│ │ [+] END        │ ICON │  Drag into   │ │
│ │ [+] PROCESS    └──────┘  canvas      │ │
│ │ [+] DECISION                         │ │
│ │ [+] FOR LOOP                         │ │
│ │ [+] WHILE LOOP                       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Right-click Menu:                        │
│ ├─ [Edit]      (change block content)   │
│ ├─ [Duplicate] (copy block)             │
│ ├─ [Delete]    (remove block)           │
│ └─ [Properties](view/edit details)      │
│                                          │
│ Block Properties Panel:                  │
│ ┌──────────────────────────────────────┐ │
│ │ Selected Block: For Loop             │ │
│ │ ────────────────────────────────────  │ │
│ │ Variable: i                          │ │
│ │ Start: 0                             │ │
│ │ End: 5                               │ │
│ │ Increment: 1                         │ │
│ │                                      │ │
│ │ [Edit] [Apply] [Cancel]             │ │
│ └──────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘


================================================================================
5. ERROR DISPLAY (In Console Tab)
================================================================================

NOTE: "Infinite Loop Detected" is MVP (for-loops only). "Runtime Error"
(division by zero) and "Input Type Error" (Scanner) depend on Scanner/general
arithmetic support in the interpreter, which is Phase 2 — keep as target
design for later, not required for the Phase 1 for-loop MVP.

--- Runtime Error Example (Phase 2) ---
┌────────────────────────────────────────────────────────────────┐
│ ❌ ERROR at Line 5                                             │
│ ────────────────────────────────────────────────────────────   │
│                                                                │
│ Error Type: ArithmeticException                               │
│ Message: Division by zero                                     │
│                                                                │
│ Code:                                                          │
│    5 │ int result = 10 / 0;  ← This line                     │
│      │              ^^^^^^                                    │
│                                                                │
│ Suggestion:                                                    │
│ ⚠️  Check if denominator is not zero before dividing.        │
│     Example: if (divisor != 0) { result = 10 / divisor; }   │
│                                                                │
│ [Retry] [Clear Error] [View Documentation]                   │
└────────────────────────────────────────────────────────────────┘

--- Infinite Loop Error ---
┌────────────────────────────────────────────────────────────────┐
│ ❌ ERROR: Infinite Loop Detected                              │
│ ────────────────────────────────────────────────────────────   │
│                                                                │
│ The execution timed out after 5 seconds.                      │
│ This usually means your loop runs forever.                    │
│                                                                │
│ Suspicious Code (Line 2):                                     │
│    2 │ for (int i = 0; i < 10; i--) {  ← i decreases!      │
│                                                                │
│ Suggestion:                                                    │
│ ⚠️  Your loop variable 'i' starts at 0 but decreases (i--)   │
│     The condition (i < 10) will never become false!          │
│     Did you mean i++ instead of i--?                         │
│                                                                │
│ [Retry] [Clear Error]                                        │
└────────────────────────────────────────────────────────────────┘

--- Input Type Error (Phase 2) ---
┌────────────────────────────────────────────────────────────────┐
│ ❌ ERROR at Line 8                                             │
│ ────────────────────────────────────────────────────────────   │
│                                                                │
│ Error Type: InputMismatchException                            │
│ Message: Expected integer input, got "abc"                    │
│                                                                │
│ Code:                                                          │
│    8 │ int x = scanner.nextInt();  ← Waiting for input      │
│                                                                │
│ What Happened:                                                │
│ The code asked for an integer but you entered "abc"          │
│                                                                │
│ Suggestion:                                                    │
│ ⚠️  nextInt() expects a whole number (e.g., 5, 42, -10)     │
│     For text input, use nextLine() instead.                  │
│                                                                │
│ [Retry] [Clear Error]                                        │
└────────────────────────────────────────────────────────────────┘


================================================================================
6. SCANNER INPUT DIALOG (In Variables Tab) — Phase 2
================================================================================

Target design for once Scanner support lands (Phase 2, not part of the
Phase 1 for-loop MVP). When code calls Scanner.nextInt(), Scanner.nextLine(), etc:

┌────────────────────────────────────────────────────────────────┐
│ SCANNER INPUT (Inline in Variables Tab - At Top)              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Code is waiting for input...                                  │
│                                                                │
│ Enter input for Scanner.nextInt():                            │
│ ┌───────────────────────────────────────┐                     │
│ │ [_____________________] [OK]          │                     │
│ └───────────────────────────────────────┘                     │
│                                                                │
│ Hint: Please enter an integer (e.g., 5, 100, -10)            │
│                                                                │
│ Current Line:                                                  │
│ int x = scanner.nextInt();  ← Paused here, waiting for input │
│                                                                │
└────────────────────────────────────────────────────────────────┘


================================================================================
7. TOP NAVIGATION BAR
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  [☰ KOUDO]  [New Project] [Open] [Save] [Export]       [🌙 Dark] [⚙️ Settings]│
│                                                                              │
│  File Menu:                    Export Options:          Settings:           │
│  ├─ New Project               ├─ .java (code only)     ├─ Dark/Light Mode  │
│  ├─ Open Project              ├─ .json (full project)  ├─ Font Size        │
│  ├─ Save Project              ├─ .zip (bundle)         ├─ Keyboard Layout  │
│  ├─ Recent Projects ▶         ├─ Flowchart as PNG      ├─ Editor Theme     │
│  ├─ Import Project            └─ Flowchart as SVG      ├─ Output Limit     │
│  └─ Exit                                                └─ Preferences      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


================================================================================
8. DARK MODE DESIGN
================================================================================

Background Colors:
- Primary: #0A0E27 (Dark Navy)
- Secondary: #1A1F3A (Slightly Lighter)
- Panels: #15192E
- Code Editor: #0D1117

Text Colors:
- Primary Text: #E0E0E0 (Light Gray)
- Secondary Text: #A0A0A0 (Medium Gray)
- Highlight: #00D9FF (Bright Cyan)
- Accent: #00E5FF (Lighter Cyan)

Flowchart Colors:
- Blocks: Dark gray with light blue borders
- Text: Light gray
- Highlight: Bright cyan

Code Editor:
- Keywords: Light purple (#BD93F9)
- Strings: Light green (#A1EFB3)
- Numbers: Light orange (#FFB86C)
- Comments: Light gray (#6A737D)
- Current Line: Dark cyan background (#00D9FF22)

Output Panel:
- Console: Dark background with light text
- Error: Red text (#FF6B6B)
- Success: Green text (#51CF66)
- Warning: Yellow text (#FFD93D)


================================================================================
9. LIGHT MODE DESIGN
================================================================================

Background Colors:
- Primary: #FFFFFF (White)
- Secondary: #F5F5F5 (Light Gray)
- Panels: #FAFAFA
- Code Editor: #FFFFFF

Text Colors:
- Primary Text: #333333 (Dark Gray)
- Secondary Text: #666666 (Medium Gray)
- Highlight: #0066FF (Bright Blue)
- Accent: #0080FF (Lighter Blue)

Flowchart Colors:
- Blocks: White with blue borders
- Text: Dark gray
- Highlight: Bright blue

Code Editor:
- Keywords: Dark purple (#0000FF)
- Strings: Dark green (#008000)
- Numbers: Dark orange (#FF8C00)
- Comments: Gray (#808080)
- Current Line: Light blue background (#0066FF22)

Output Panel:
- Console: White background with dark text
- Error: Red text (#C41E3A)
- Success: Green text (#008000)
- Warning: Orange text (#FF8C00)


================================================================================
10. RESPONSIVE DESIGN (Mobile)
================================================================================

--- Tablet View (768px - 1023px) ---
┌────────────────────────────────┐
│ [☰ KOUDO]  [Tabs]  [Settings]  │
├────────────────────────────────┤
│                                │
│   [⊟ Flowchart] [▢ Code] [⊞]  │  ← Tab switcher
│                                │
│  (Flowchart shown, can switch) │
│                                │
│      [▶ Run] [⏸ Step]         │
│                                │
├────────────────────────────────┤
│                                │
│     OUTPUT PANEL (full width)  │
│                                │
└────────────────────────────────┘

--- Mobile View (<768px) ---
┌──────────────────────┐
│ [☰] [Tabs] [Settings]│
├──────────────────────┤
│                      │
│  [◾ Flowchart]      │
│  [◾ Code]           │
│  [◾ Output]         │
│                      │
│  Full-width toggle   │
│  between views       │
│                      │
└──────────────────────┘


================================================================================
11. KEYBOARD SHORTCUTS
================================================================================

Global:
  Ctrl+N         New Project
  Ctrl+O         Open Project
  Ctrl+S         Save Project
  Ctrl+Shift+E   Export Project
  Ctrl+Q         Settings
  Ctrl+Z         Undo
  Ctrl+Y         Redo
  Ctrl+/         Toggle Dark Mode

Code Editor:
  Ctrl+F         Find
  Ctrl+H         Find & Replace
  Tab            Indent
  Shift+Tab      Unindent
  Ctrl+L         Select Line
  Ctrl+D         Duplicate Line
  Ctrl+Shift+K   Delete Line
  Alt+↑/↓        Move Line Up/Down

Execution (Step-through Mode):
  ↓ Arrow        Next Step
  ↑ Arrow        Previous Step
  Space          Toggle Play/Pause (if auto-play enabled in Phase 2)
  R              Reset Execution
  Escape         Exit Step Mode


================================================================================
12. VISUAL FLOW EXAMPLES
================================================================================

--- Run (Custom Interpreter, no runtime download) ---
User clicks [▶ Run]
    ↓
Code runs instantly through Koudo's own JS/TS interpreter
(no "loading Java runtime" step — there is no real JVM, see CLAUDE.md
Execution Engine Decision)
    ↓
Console fills with output
    ↓
Done!

--- Step-through Execution ---
User clicks [⏸ Step] → enters step-through mode
    ↓
Code highlights Line 1 (yellow)
Variables show initial state
    ↓
User presses ↓ or clicks [⏭ Next]
    ↓
Line 1 executes
Variables update with PULSE animation
Step counter: Step 1/14
    ↓
[Repeat for each step]
    ↓
User presses ↑ or clicks [⏮ Reset]
    ↓
Fresh start (console cleared, step counter reset to 0)

--- Scanner Input Flow (Phase 2) ---
Code hits: int x = scanner.nextInt();
    ↓
Execution pauses
Input field appears at top of Variables tab
    ↓
User types: 5
User clicks [OK]
    ↓
x = 5 variable updates
Execution continues to next line

================================================================================
END OF UI DESIGN
================================================================================
