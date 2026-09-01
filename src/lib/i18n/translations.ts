// Flat key -> template string, one object per language. Every value can
// carry {placeholder} tokens (see stores/i18n.ts's interpolate()) — plain
// strings just have none. `en` is the source of truth for which keys exist
// (TranslationKey is derived from it); `id` is typed against the exact same
// key set so a missing Indonesian translation is a compile error, not a
// silent English fallback discovered by clicking around.
//
// Deliberately NOT translated here: Java type keywords (int/double/String/
// boolean/...), true/false literals, and generated Java/Pseudocode output.
// For/While/True/False are also left as-is — borrowed CS terms usually kept
// in English even in Indonesian programming instruction, same reasoning as
// the type keywords. Start/End's on-canvas text *is* translated (see
// 'block.type.start'/'block.type.end' below) even though they're xyflow's
// built-in node types with a label baked into node data at creation time,
// not read reactively like every other block's own template — see
// stores/sync.ts's syncStartEndLabels, which rewrites that baked label
// in place whenever the language (or the node list) changes.
const en = {
  // TopNavbar
  'nav.undo': 'Undo',
  'nav.undoTitle': 'Undo (Ctrl+Z)',
  'nav.redo': 'Redo',
  'nav.redoTitle': 'Redo (Ctrl+Shift+Z)',
  'nav.project': 'Project',
  'nav.new': 'New',
  'nav.open': 'Open Project',
  'nav.save': 'Save Project',
  'nav.exportJava': 'Export Java',
  'nav.exportPseudocode': 'Export Pseudocode',
  'nav.canvas': 'Canvas',
  'nav.arrange': 'Arrange',
  'nav.arrangeTitle': 'Arrange blocks into a straight vertical line (Alt+Shift+A)',
  'nav.downloadPng': 'Download PNG',
  'nav.downloadPngTitle': 'Download the flowchart as a PNG image',
  'nav.preferences': 'Preferences',
  'nav.help': 'Help',
  // Mobile-only: the single "Menu" button that opens all of the above (see
  // TopNavbar.svelte's nav-menu) — desktop keeps them as separate buttons.
  'nav.menu': 'Menu',
  'nav.helpGuide': 'Guide',
  'nav.modeHeading': 'Mode',
  'nav.variableModeBeginner': 'Beginner Mode',
  'nav.variableModeBeginnerHint': "Declare a variable with just a value — its type is inferred automatically",
  'nav.variableModeStandard': 'Standard Mode',
  'nav.variableModeStandardHint': 'Declare a variable by choosing its data type explicitly',
  'nav.language': 'Language',
  'nav.confirmNew': 'Clear the canvas and start a new flowchart? This cannot be undone.',
  'nav.confirmOpen': 'Clear the canvas and open a different flowchart? This cannot be undone.',
  'nav.projectNameLabel': 'Project name',
  'nav.codeHeading': 'Code',
  'nav.codeIndentHeading': 'Code Indent',
  'nav.codeIndent2': '2 spaces',
  'nav.codeIndent4': '4 spaces',
  'nav.codeIndentTab': 'Tab character',
  'nav.codeFontHeading': 'Code Font',
  'nav.codeFontDefault': 'Default',
  'nav.themeHeading': 'Theme',
  'nav.themeSystem': 'System',
  'nav.themeGroupLight': 'Light',
  'nav.themeGroupDark': 'Dark',
  'nav.theme.default': 'Default',
  'nav.theme.warm': 'Warm',
  'nav.theme.cool': 'Cool',
  'nav.theme.nature': 'Nature',

  // ThemeToggle / FullscreenToggle
  'toggle.themeTitle': 'Toggle dark/light mode (Alt+Shift+T)',
  'toggle.enterFullscreen': 'Enter fullscreen',
  'toggle.exitFullscreen': 'Exit fullscreen',

  // HelpModal
  'help.title': 'How to Use KOUDO',
  'help.close': 'Close',
  'help.gettingStarted.heading': 'Getting started',
  'help.gettingStarted.body':
    'Drag a block from the palette (top-left of the canvas) and drop it below Start. Connect blocks by dragging from the small handle at the bottom of one block to the top of another — dropping a new block onto the bottom of the flow, or directly between two already-connected blocks, wires it in automatically.',
  'help.running.heading': 'Running your program',
  'help.running.body':
    'Run, Step, and Stop live above the Output panel. Run executes the whole program at once — the Output panel shows what it prints. Step runs it one line at a time instead, highlighting the block currently executing and updating a live Variable Watcher table after every step. Both need a connected End block first.',
  'help.codePanel.heading': 'Code panel',
  'help.codePanel.body':
    "The Java tab shows the flowchart translated into a real, compilable Java class, kept up to date automatically as you edit the canvas — it's read-only for now, since the canvas is the only place to edit during this phase. The Pseudocode tab shows the same program in plain structured English, for reading — also generated from the flowchart, not editable.",
  'help.variableModes.heading': 'Variable modes',
  'help.variableModes.body':
    'Switch modes from the Preferences menu. Standard Mode (the default) is the traditional way: you pick the type yourself, and a value is optional. Beginner Mode infers a variable\'s type from the value you give it — no type names to learn yet. A value isn\'t required there either; leave it blank and pick Whole number / Text / Decimal number instead.',
  'help.menus.heading': 'Menus',
  'help.menus.body':
    'Project — New, Open/Save Project (a .kdo file), Export Java (a compilable .java file named after the project), and Export Pseudocode. Preferences — variable mode, language, code indent, and code font. Canvas — Arrange (tidy the layout into columns) and Download PNG. Help — this guide, and Tutorial (replay the first-time walkthrough any time). The ☀️/🌙 button, top-right, picks a theme — 4 light, 4 dark, or System.',
  'help.shortcuts.heading': 'Keyboard shortcuts',
  'help.shortcuts.run': 'Run',
  'help.shortcuts.step': 'Step / Next Step',
  'help.shortcuts.arrange': 'Arrange',
  'help.shortcuts.theme': 'Toggle dark / light mode',
  'help.shortcuts.undo': 'Undo',
  'help.shortcuts.redo': 'Redo',
  'help.tips.heading': 'Tips',
  'help.tips.merge': 'Dropping a block of the same kind onto an existing one merges them into a single block with multiple lines.',
  'help.tips.rightClick': 'Right-click a block or a connecting line to Duplicate or Delete it.',
  'help.tips.fullscreen': 'The ⛶ button, top-right, toggles fullscreen.',
  'help.tips.browserOnly': 'Everything runs entirely in your browser — nothing you build is ever sent anywhere.',
  'help.tips.autosave': 'Your work is saved automatically to this browser as you go — Undo/Redo (top-left) covers every edit, including a whole block drag.',
  'help.tips.constAndReorder': "In a Variable block, drag a row's ⠿ handle to reorder it, and check its box to make it a Java `final` constant.",
  'help.tips.tutorial': "New here? Reopen the guided tutorial any time from Help → Tutorial.",

  // HelpModal — top-level tabs
  'help.tab.koudo': 'Koudo',
  'help.tab.flowchart': 'Flowchart',
  'help.tab.pseudocode': 'Pseudocode',
  'help.tab.java': 'Java',

  // HelpModal — Flowchart tutorial tab
  'help.flowchartTutorial.intro.heading': 'What is a flowchart?',
  'help.flowchartTutorial.intro.body':
    'A flowchart is a diagram that shows the steps of a program as connected shapes, followed from Start to End. Each shape represents one kind of action; arrows show the order they run in.',
  'help.flowchartTutorial.symbols.heading': 'Symbols',
  'help.flowchartTutorial.symbol.terminal.name': 'Terminal (Start / End)',
  'help.flowchartTutorial.symbol.terminal.desc': 'Marks where the program begins and ends — at most one of each.',
  'help.flowchartTutorial.symbol.process.name': 'Process',
  'help.flowchartTutorial.symbol.process.desc':
    'A step that does or changes something — declaring a variable, or updating one that already exists.',
  'help.flowchartTutorial.symbol.inputOutput.name': 'Input / Output',
  'help.flowchartTutorial.symbol.inputOutput.desc': 'Reads a value in from the user, or prints one out.',
  'help.flowchartTutorial.symbol.decision.name': 'Decision',
  'help.flowchartTutorial.symbol.decision.desc':
    'Asks a true/false question and sends the flow down one of two paths depending on the answer.',
  'help.flowchartTutorial.symbol.loop.name': 'Loop',
  'help.flowchartTutorial.symbol.loop.desc': 'Repeats a group of steps while a condition holds, or a fixed number of times.',
  'help.flowchartTutorial.symbol.subroutine.name': 'Predefined Process (Subroutine)',
  'help.flowchartTutorial.symbol.subroutine.desc':
    'Calls a separate, named flow defined elsewhere on the canvas (its own Sub Start/Sub End pair) — like calling a method in Java.',
  'help.flowchartTutorial.symbol.arrow.name': 'Arrow',
  'help.flowchartTutorial.symbol.arrow.desc': 'Connects two shapes and shows which one runs next.',
  'help.flowchartTutorial.reading.heading': 'Reading the flow',
  'help.flowchartTutorial.reading.body':
    'Follow the arrows one step at a time, starting at Start. Most shapes lead to exactly one next step — a Decision or Loop is the exception, sending the flow down a different path depending on a condition, until it eventually rejoins the main line.',
  'help.flowchartTutorial.example.heading': 'A simple example',
  'help.flowchartTutorial.example.body':
    'A flowchart that reads someone\'s age and says whether they\'re an adult: Start, a step reading age from the user, a Decision asking "age >= 18?", one path printing "Adult" and the other "Minor", both rejoining before End. Building exactly this on the canvas — with the Variable, Input, If, and Output blocks — produces the Java and Pseudocode shown in the Code panel automatically.',

  // HelpModal — Pseudocode tutorial tab
  'help.pseudocodeTutorial.intro.heading': 'What is pseudocode?',
  'help.pseudocodeTutorial.intro.body':
    "Pseudocode writes out a program's logic in plain, structured English instead of a real programming language's exact syntax — useful for planning or explaining a program without worrying about compiler rules. The Pseudocode tab generates it automatically from your flowchart, in one fixed style.",
  'help.pseudocodeTutorial.keywords.heading': 'Keywords used here',
  'help.pseudocodeTutorial.keyword.startEnd.desc': 'The boundaries of the whole program.',
  'help.pseudocodeTutorial.keyword.declare.desc':
    'Introduces a new variable — add "= value" after the type to give it a starting value.',
  'help.pseudocodeTutorial.keyword.input.desc': 'Reads a value from the user into x.',
  'help.pseudocodeTutorial.keyword.output.desc': 'Prints a value.',
  'help.pseudocodeTutorial.keyword.assign.desc':
    'Assigns a new value to x — a Java +=, -=, *=, or /= is spelled out the same way, e.g. "x = x + value".',
  'help.pseudocodeTutorial.keyword.if.desc': 'Branches on a condition; ELSE is optional.',
  'help.pseudocodeTutorial.keyword.for.desc': 'A counting loop — init, condition, and update, same idea as Java\'s for.',
  'help.pseudocodeTutorial.keyword.while.desc': 'Repeats the body for as long as the condition holds.',
  'help.pseudocodeTutorial.keyword.subroutine.desc':
    'Defines a separate, named block of steps that can be called from elsewhere — like a method in Java.',
  'help.pseudocodeTutorial.keyword.call.desc': 'Runs a SUBROUTINE defined elsewhere, then continues right after this line.',
  'help.pseudocodeTutorial.keyword.return.desc':
    "Ends a non-void SUBROUTINE's run and sends this value back to wherever it was called from.",
  'help.pseudocodeTutorial.example.heading': 'Example',

  // HelpModal — Java tutorial tab (sub-tabs)
  'help.javaTutorial.dataTypes.label': 'Data Types',
  'help.javaTutorial.dataTypes.body':
    "Every variable in Java has a data type, fixed when it's declared. This app supports: int and long for whole numbers, double and float for decimals, boolean for true/false, char for a single character, and String for text.",
  'help.javaTutorial.variables.label': 'Variables',
  'help.javaTutorial.variables.body':
    'A variable is a named box that holds a value of its declared type. Declare it once with `type name = value;` (or just `type name;` to declare without a starting value), then read or change it by name anywhere after that.',
  'help.javaTutorial.operators.label': 'Operators',
  'help.javaTutorial.operators.body':
    'Arithmetic: + - * / % (remainder). Comparison: == != < > <= >= — used in a Decision or loop condition, always producing a boolean. Logical: && (and), || (or), ! (not), for combining conditions. Assignment: = to set a value, and +=, -=, *=, /= as shortcuts for "update based on the current value".',
  'help.javaTutorial.inputOutput.label': 'Input / Output',
  'help.javaTutorial.inputOutput.body':
    'System.out.println(value) prints a value, followed by a new line. Reading input needs a Scanner — Scanner scanner = new Scanner(System.in); — then a method matching the type being read: nextInt() for int, nextDouble() for double, next() for a single word of text, and so on.',
  'help.javaTutorial.conditionals.label': 'Conditionals',
  'help.javaTutorial.conditionals.body':
    "An if statement runs a block only when its condition is true; an optional else runs instead when it's false. Chain more checks with else if.",
  'help.javaTutorial.loops.label': 'Loops',
  'help.javaTutorial.loops.body':
    "A for loop repeats a fixed number of times — its parentheses hold an init (runs once), a condition (checked before every pass), and an update (runs after every pass). A while loop repeats for as long as its condition holds, with no built-in counter.",

  // OutputPanel
  'output.run': '▶ Run',
  'output.step': '⏭ Step',
  'output.nextStep': '⏭ Next Step',
  'output.stop': '⏹ Stop',
  'output.runTitleEnabled': 'Run the code (Alt+Shift+R) — output appears below',
  'output.runTitleDisabled': 'Connect an End block to the flowchart before running',
  'output.runTitleIfIncomplete': 'Every if block needs both its true and false branches to lead to an End block',
  'output.stepTitleNoStart': 'Add a Start block first',
  'output.stepTitleNoEnd': 'Connect an End block to the flowchart before stepping',
  'output.stepTitleIfIncomplete': 'Every if block needs both its true and false branches to lead to an End block',
  'output.stepTitleReady': 'Run one line at a time, highlighting each block on the canvas (Alt+Shift+S)',
  'output.nextStepTitle': 'Run the next line (Alt+Shift+S)',
  'output.heading': 'Output',
  'output.clear': 'Clear',
  'output.clearTitleStepping': 'Stop the step run to clear the output',
  'output.clearTitleReady': 'Clear the output',
  'output.line': 'Line {index}/{total}:',
  'output.emptyPrompt': 'Click {run}, or {step}, above to see output here.',
  'output.noOutput': '(no output)',
  'output.variables': 'Variables',
  'output.noVariablesRun': 'No variables',
  'output.noVariablesPrompt': 'Run the program to see variables here',

  // CodeEditorPanel
  'code.pseudocodeTab': 'Pseudocode',
  'code.javaTab': 'Java',
  'code.decreaseTextSize': 'Decrease text size',
  'code.increaseTextSize': 'Increase text size',
  'code.copy': 'Copy code',
  'code.copied': 'Copied to clipboard',
  'code.copyFailed': "Couldn't copy to clipboard",

  // Toast
  'toast.dismiss': 'Dismiss',
  'toast.couldNotPlaceBlock': "Couldn't place that block: {error}",
  'toast.needsDeclaredVariableInput':
    'Declare a variable before adding an Input block — it needs an existing variable to read a value into.',
  'toast.needsDeclaredVariableAssign':
    'Declare a variable before adding an Assign block — it needs an existing variable to assign a value to.',

  // CanvasContextMenu
  'contextMenu.duplicate': 'Duplicate',
  'contextMenu.delete': 'Delete',

  // BlockPalette
  'palette.heading': 'Blocks',
  'palette.expand': 'Expand the block palette',
  'palette.minimize': 'Minimize the block palette',
  'palette.chipAlreadyOnCanvas': '{label} — already on the canvas',
  'palette.chipComingSoon': '{label} — coming soon',
  'palette.chipDragHint': 'Drag onto the canvas to add {article} {label} block',
  'palette.comingSoonSuffix': ' (soon)',

  // Block type display names
  'block.type.start': 'Start',
  'block.type.end': 'End',
  'block.type.declare': 'Variable',
  'block.type.assign': 'Assign',
  'block.type.input': 'Input',
  'block.type.process': 'Output',
  'block.type.decision': 'If',
  'block.type.forLoop': 'For',
  'block.type.whileLoop': 'While',
  'block.type.subroutineStart': 'Sub Start',
  'block.type.subroutineCall': 'Call Sub',
  'block.type.subroutineEnd': 'Sub End',

  // Subroutine Start/Call/End blocks
  'subroutineStart.label': 'Sub',
  'subroutineStart.namePlaceholder': 'name',
  'subroutineStart.invalidName': '"{name}" is not a valid Java method name',
  'subroutineStart.returnsLabel': 'Returns',
  'subroutineStart.parametersLabel': 'Parameters',
  'subroutineStart.paramPlaceholder': 'param',
  'subroutineStart.addParam': '+ Add parameter',
  'subroutineStart.removeParam': 'Remove parameter',
  'subroutineEnd.label': 'End',
  'subroutineEnd.returnLabel': 'Return',
  'subroutineCall.label': 'Call',
  'subroutineCall.noSubroutines': 'No subroutines yet',
  'subroutineCall.discardResult': '(discard result)',

  // Shared "no variables yet" / "choose" dropdown prompt (Input/Output/Assign)
  'shared.noVariables': 'No variables',
  'shared.choose': 'Choose',
  // Shared plain "Value" placeholder (Declare's String/char/default fields,
  // Assign's String/char field).
  'shared.value': 'Value',
  // Shared array-element index field (Process/Assign/Input, next to an
  // "arr[ ]" dropdown pick) — free text, since an index is often an
  // expression like "i" or "i + 1", not just a literal number.
  'shared.indexPlaceholder': 'index',
  'shared.indexTitle': 'Index into the array (a number or an expression like i)',
  // Shared row drag handle (Declare/Assign/Process/Input) — reorders that
  // row within its block; Java executes lines in source order, so this
  // changes what's visible to earlier/later lines, not just cosmetic.
  'shared.dragToReorder': 'Drag to reorder',

  // DeclareNode
  'declare.name': 'Name',
  'declare.nameTitle': 'Variable name',
  'declare.valueOptional': 'Value',
  'declare.valueTitle': "Variable's initial value",
  'declare.typeWhole': 'Whole number',
  'declare.typeDecimal': 'Decimal number',
  'declare.typeText': 'Text',
  'declare.typeTitle': "No value given — choose this variable's type",
  'declare.invalidName': "'{name}' is not a valid Java variable name",
  'declare.remove': 'Remove this variable',
  'declare.add': '+ Add variable',
  'declare.constTitle': 'Constant (Java final — cannot be reassigned)',
  'declare.arrayLabel': 'Array',
  'declare.arrayValuePlaceholder': 'size, e.g. 5, or 1,2,3',
  'declare.arrayValueHint': 'A number sets the size (e.g. 5); a comma-separated list sets the elements (e.g. 1,2,3)',

  // AssignNode
  'assign.valueOrLiteral': '"text" or 5',
  'assign.customValue': '✎ Value',
  'assign.remove': 'Remove this assignment',
  'assign.add': '+ Add assignment',

  // InputNode
  'input.label': 'Input',
  'input.prompt': 'Prompt',
  'input.remove': 'Remove this input',
  'input.add': '+ Add input',

  // ProcessNode (Output block)
  'process.print': 'Print',
  'process.newlineTitle': 'Start a new line after printing',
  'process.customValue': '✎ Value',
  'process.valueOrLiteralInferred': 'Value',
  'process.valueOrLiteral': '"text" or 5',
  'process.removeLine': 'Remove this line',
  'process.add': '+ Add output',

  // DecisionNode / WhileLoopNode / ForLoopNode
  'flow.condition': 'Condition',
  'flow.conditionTitle': 'Condition — checked before every iteration',
  'flow.initTitle': 'Init — runs once, before the loop starts',
  'flow.updateTitle': 'Update — runs after every iteration of the body',
  'flow.loopLabel': 'loop',
  'flow.exitLabel': 'exit',

  // FlowchartBoard
  'flowchart.canvasAriaLabel': 'Flowchart canvas — drop blocks here',

  // App.svelte
  'app.resizeColumnsAriaLabel': 'Resize flowchart and code panels',
  'app.resizeRowAriaLabel': 'Resize output panel',
  'app.showCodePanel': 'Show the code panel',
  'app.hideCodePanel': 'Hide the code panel',

  // TutorialWelcomeModal — shown once, automatically, on a first visit
  'welcome.title': 'Welcome to KOUDO! 👋',
  'welcome.body':
    "KOUDO turns a flowchart you build into real, runnable Java code. Pick your language below, then let's build your first program together — declaring a variable and showing it.",
  'welcome.languageLabel': 'Language',
  'welcome.start': 'Start Tutorial',
  'welcome.skip': 'Skip',

  // TutorialCoach — reopenable any time from the Help menu's Tutorial
  // submenu (see TopNavbar.svelte's nav.tutorial / stores/tutorial.ts)
  'tutorial.dragToMove': 'Drag to move',
  'tutorial.back': 'Back',
  'tutorial.next': 'Next',
  'tutorial.skip': 'Skip tutorial',
  'tutorial.finish': 'Finish',
  'tutorial.stepOf': 'Step {index} of {total}',

  // Guide picker (Help menu -> Tutorial submenu) — "basic" is the only one
  // shown automatically to a first-time visitor (see tutorial.ts's
  // startTutorial); the rest are opt-in.
  'tutorial.track.basic': 'Basic: Declare & Show',
  'tutorial.track.variableConstAssignment': 'Variables, Constants & Assignment',
  'tutorial.track.inputOutput': 'Input & Output',
  'tutorial.track.decision': 'Decision (If)',
  'tutorial.track.forLoop': 'For Loop',
  'tutorial.track.whileLoop': 'While Loop',
  'tutorial.track.subroutine': 'Subroutines (Sub Start/End/Call)',

  // Basic guide
  'tutorial.step.basic.welcome.title': "Let's build something!",
  'tutorial.step.basic.welcome.body':
    "On the left is your canvas — build a flowchart by dragging blocks from the palette. On the right, KOUDO turns it into Pseudocode and real Java code automatically. We'll declare a variable and show it.",
  'tutorial.step.basic.declareName.title': 'Declare a variable',
  'tutorial.step.basic.declareName.body':
    "Drag the 'Variable' block from the palette onto the canvas. Name it `nama` and give it a value like `\"Andi\"` (with quotes, since it's text).",
  'tutorial.step.basic.output.title': 'Show it',
  'tutorial.step.basic.output.body': "Drag an 'Output' block onto the canvas, then add `nama` as the variable to print.",
  'tutorial.step.basic.end.title': 'Finish the flow',
  'tutorial.step.basic.end.body': "Drag an 'End' block onto the canvas to complete your program.",
  'tutorial.step.basic.arrange.title': 'Tidy the layout',
  'tutorial.step.basic.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly in a single column.",
  'tutorial.step.basic.run.title': 'Run it!',
  'tutorial.step.basic.run.body': 'Click ▶ Run below the canvas. Expect to see: `Andi`',
  'tutorial.step.basic.done.title': '🎉 You did it!',
  'tutorial.step.basic.done.body':
    'You just declared a variable and displayed it with KOUDO. Open Help → Tutorial to try the other guides: constants & calculations, input, decisions, and loops.',

  // Variables, Constants & Assignment guide — the circle-area walkthrough
  'tutorial.step.vca.welcome.title': "Let's build something!",
  'tutorial.step.vca.welcome.body':
    "On the left is your canvas — build a flowchart by dragging blocks from the palette. On the right, KOUDO turns it into Pseudocode and real Java code automatically. We'll calculate a circle's area: `area = π × radius²`.",
  'tutorial.step.vca.declareRadius.title': 'Declare a variable',
  'tutorial.step.vca.declareRadius.body':
    "Drag the 'Variable' block from the palette onto the canvas. Name it `radius` and give it a value, e.g. `5`.",
  'tutorial.step.vca.declarePi.title': 'Add a constant',
  'tutorial.step.vca.declarePi.body':
    "Inside that same block, click '+ Add variable'. Check the const box, name it `PI`, and set its value to `3.14` — a constant can't be changed later.",
  'tutorial.step.vca.declareArea.title': 'One more variable',
  'tutorial.step.vca.declareArea.body':
    "Click '+ Add variable' once more. Name this one `area`, set its type to `double` (decimal number), and leave its value empty for now — we'll calculate it in the next step.",
  'tutorial.step.vca.assign.title': 'Calculate the area',
  'tutorial.step.vca.assign.body': "Drag an 'Assign' block onto the canvas. Set: `area = PI * radius * radius`",
  'tutorial.step.vca.output.title': 'Show the result',
  'tutorial.step.vca.output.body': "Drag an 'Output' block onto the canvas, then add `area` as the variable to print.",
  'tutorial.step.vca.end.title': 'Finish the flow',
  'tutorial.step.vca.end.body': "Drag an 'End' block onto the canvas to complete your program.",
  'tutorial.step.vca.arrange.title': 'Tidy the layout',
  'tutorial.step.vca.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly in a single column.",
  'tutorial.step.vca.run.title': 'Run it!',
  'tutorial.step.vca.run.body':
    "Click ▶ Run below the canvas to calculate and print the circle's area. With `radius = 5` and `PI = 3.14`, expect to see: `78.5`",
  'tutorial.step.vca.done.title': '🎉 You did it!',
  'tutorial.step.vca.done.body':
    'You just declared variables, used a constant, calculated a value, and ran your first program in KOUDO. Open Help → Tutorial to try the other guides: input, decisions, and loops.',

  // Input & Output guide
  'tutorial.step.io.welcome.title': 'Talk to your program',
  'tutorial.step.io.welcome.body':
    "This guide adds an 'Input' block so your flowchart can ask a question while it runs, then show the answer back with 'Output'.",
  'tutorial.step.io.declareVar.title': 'Declare a variable',
  'tutorial.step.io.declareVar.body':
    "Drag the 'Variable' block onto the canvas. Name it `nama`, set its type to `String`, and leave its value empty — Input will fill it in when the program runs.",
  'tutorial.step.io.input.title': 'Ask for input',
  'tutorial.step.io.input.body':
    "Drag an 'Input' block onto the canvas. Pick `nama` from the dropdown, and set its prompt to something like `What's your name?`",
  'tutorial.step.io.output.title': 'Show it back',
  'tutorial.step.io.output.body': "Drag an 'Output' block onto the canvas, then add `nama` as the variable to print.",
  'tutorial.step.io.end.title': 'Finish the flow',
  'tutorial.step.io.end.body': "Drag an 'End' block onto the canvas to complete your program.",
  'tutorial.step.io.arrange.title': 'Tidy the layout',
  'tutorial.step.io.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly in a single column.",
  'tutorial.step.io.run.title': 'Run it!',
  'tutorial.step.io.run.body':
    "Click ▶ Run below the canvas. When asked, type your name and press Enter — KOUDO prints it right back.",
  'tutorial.step.io.done.title': '🎉 You did it!',
  'tutorial.step.io.done.body':
    'You just read a value while the program was running and displayed it. Open Help → Tutorial to try decisions and loops next.',

  // Decision (If) guide
  'tutorial.step.decision.welcome.title': 'Make a choice',
  'tutorial.step.decision.welcome.body':
    "This guide branches your flow with an 'If' block — we'll check whether a number is even or odd.",
  'tutorial.step.decision.declareNumber.title': 'Declare a variable',
  'tutorial.step.decision.declareNumber.body':
    "Drag the 'Variable' block onto the canvas. Name it `angka`, set its type to `int`, and give it a value, e.g. `7`.",
  'tutorial.step.decision.decision.title': 'Add the check',
  'tutorial.step.decision.decision.body': "Drag an 'If' block onto the canvas. Set its condition to `angka % 2 == 0`.",
  'tutorial.step.decision.outputEven.title': 'Branch: True',
  'tutorial.step.decision.outputEven.body':
    "From the 'If' block's True branch, drag an 'Output' block and print the custom text `Even`.",
  'tutorial.step.decision.outputOdd.title': 'Branch: False',
  'tutorial.step.decision.outputOdd.body':
    "From the 'If' block's False branch, drag another 'Output' block and print the custom text `Odd`.",
  'tutorial.step.decision.end.title': 'Finish the flow',
  'tutorial.step.decision.end.body': "Drag one 'End' block and connect both Output blocks into it.",
  'tutorial.step.decision.arrange.title': 'Tidy the layout',
  'tutorial.step.decision.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly.",
  'tutorial.step.decision.run.title': 'Run it!',
  'tutorial.step.decision.run.body': 'Click ▶ Run below the canvas. With `angka = 7`, expect to see: `Odd`',
  'tutorial.step.decision.done.title': '🎉 You did it!',
  'tutorial.step.decision.done.body':
    "You just branched your program's flow with a condition. Open Help → Tutorial to try For and While loops next.",

  // For Loop guide
  'tutorial.step.forLoop.welcome.title': 'Repeat yourself',
  'tutorial.step.forLoop.welcome.body':
    "This guide uses a 'For' block to repeat a step a fixed number of times — we'll count from 1 to 5.",
  'tutorial.step.forLoop.forLoop.title': 'Add the loop',
  'tutorial.step.forLoop.forLoop.body': "Drag a 'For' block onto the canvas. Set: init `int i = 1`, condition `i <= 5`, update `i++`.",
  'tutorial.step.forLoop.output.title': 'Print each number',
  'tutorial.step.forLoop.output.body':
    "Drag an 'Output' block from the loop's bottom handle and print `i`. Then connect its own bottom back up to the 'For' block to close the loop.",
  'tutorial.step.forLoop.end.title': 'Finish the flow',
  'tutorial.step.forLoop.end.body': "Drag an 'End' block and connect it to the loop's other branch (the exit, on the right).",
  'tutorial.step.forLoop.arrange.title': 'Tidy the layout',
  'tutorial.step.forLoop.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly.",
  'tutorial.step.forLoop.run.title': 'Run it!',
  'tutorial.step.forLoop.run.body': 'Click ▶ Run below the canvas. Expect to see `1` through `5`, one per line.',
  'tutorial.step.forLoop.done.title': '🎉 You did it!',
  'tutorial.step.forLoop.done.body':
    'You just repeated a step with a For loop. Open Help → Tutorial to try a While loop next.',

  // While Loop guide
  'tutorial.step.whileLoop.welcome.title': 'Repeat with your own counter',
  'tutorial.step.whileLoop.welcome.body':
    "This guide uses a 'While' block, which repeats as long as a condition holds — you manage the counter yourself. We'll count from 1 to 5.",
  'tutorial.step.whileLoop.declareCounter.title': 'Declare a counter',
  'tutorial.step.whileLoop.declareCounter.body':
    "Drag the 'Variable' block onto the canvas. Name it `i`, set its type to `int`, and give it a value of `1`.",
  'tutorial.step.whileLoop.whileLoop.title': 'Add the loop',
  'tutorial.step.whileLoop.whileLoop.body': "Drag a 'While' block onto the canvas. Set its condition to `i <= 5`.",
  'tutorial.step.whileLoop.output.title': 'Print the counter',
  'tutorial.step.whileLoop.output.body': "From the loop's 'loop' branch (bottom), drag an 'Output' block and print `i`.",
  'tutorial.step.whileLoop.assignIncrement.title': 'Increase the counter',
  'tutorial.step.whileLoop.assignIncrement.body':
    "Drag an 'Assign' block after Output. Set: `i = i + 1`. Then connect it back up to the 'While' block to close the loop.",
  'tutorial.step.whileLoop.end.title': 'Finish the flow',
  'tutorial.step.whileLoop.end.body': "Drag an 'End' block and connect it to the loop's 'exit' branch (on the right).",
  'tutorial.step.whileLoop.arrange.title': 'Tidy the layout',
  'tutorial.step.whileLoop.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly.",
  'tutorial.step.whileLoop.run.title': 'Run it!',
  'tutorial.step.whileLoop.run.body': 'Click ▶ Run below the canvas. Expect to see `1` through `5`, one per line.',
  'tutorial.step.whileLoop.done.title': '🎉 You did it!',
  'tutorial.step.whileLoop.done.body':
    'You just repeated a step with a While loop and managed your own counter. Open Help → Tutorial to try Subroutines next.',

  // Subroutines guide
  'tutorial.step.subroutine.welcome.title': 'Reuse steps with a subroutine',
  'tutorial.step.subroutine.welcome.body':
    "A subroutine is a mini flow you can call from your main flow, with its own name, parameters, and (optionally) a return value — like a Java method. We'll build one that squares a number.",
  'tutorial.step.subroutine.mode.title': 'Switch to Standard Mode',
  'tutorial.step.subroutine.mode.body':
    "Subroutine blocks only appear in Standard Mode. Open Preferences → Mode and choose 'Standard Mode' before continuing.",
  'tutorial.step.subroutine.subroutineStart.title': 'Start the subroutine',
  'tutorial.step.subroutine.subroutineStart.body':
    "Drag a 'Sub Start' block onto the canvas. Name it `square`, set 'Returns' to `int`, then click '+ Add parameter' and set it to `int` `n`.",
  'tutorial.step.subroutine.subroutineReturn.title': 'Return a value',
  'tutorial.step.subroutine.subroutineReturn.body':
    "Drag a 'Sub End' block below it and connect them. Set its 'Return' field to `n * n`.",
  'tutorial.step.subroutine.mainDeclare.title': 'Declare a variable for the result',
  'tutorial.step.subroutine.mainDeclare.body':
    "Back in the main flow (from the regular 'Start' block), drag a 'Variable' block. Name it `result`, type `int`.",
  'tutorial.step.subroutine.subroutineCall.title': 'Call the subroutine',
  'tutorial.step.subroutine.subroutineCall.body':
    "Drag a 'Call Sub' block after it. Choose `square` as the subroutine first — that makes a result dropdown appear on the left, set it to `result`. Then set the argument to `5`.",
  'tutorial.step.subroutine.output.title': 'Print the result',
  'tutorial.step.subroutine.output.body': "Drag an 'Output' block and print `result`.",
  'tutorial.step.subroutine.end.title': 'Finish the main flow',
  'tutorial.step.subroutine.end.body': "Drag an 'End' block and connect it after Output.",
  'tutorial.step.subroutine.arrange.title': 'Tidy the layout',
  'tutorial.step.subroutine.arrange.body':
    "Open the 'Canvas' menu at the top and choose 'Arrange' to line your blocks up neatly.",
  'tutorial.step.subroutine.run.title': 'Run it!',
  'tutorial.step.subroutine.run.body': 'Click ▶ Run below the canvas. Expect to see `25`.',
  'tutorial.step.subroutine.done.title': '🎉 You did it!',
  'tutorial.step.subroutine.done.body':
    "You just built and called your own subroutine with a parameter and a return value. Check the 'Java' tab to see the compilable method it generated. Explore the palette for more.",

  // TopNavbar — opens the Tutorial submenu above (see HelpMenu.svelte)
  'nav.tutorial': 'Tutorial',
} as const;

export type TranslationKey = keyof typeof en;

const id: Record<TranslationKey, string> = {
  // TopNavbar
  'nav.undo': 'Urungkan',
  'nav.undoTitle': 'Urungkan (Ctrl+Z)',
  'nav.redo': 'Ulangi',
  'nav.redoTitle': 'Ulangi (Ctrl+Shift+Z)',
  'nav.project': 'Proyek',
  'nav.new': 'Baru',
  'nav.open': 'Buka Proyek',
  'nav.save': 'Simpan Proyek',
  'nav.exportJava': 'Ekspor Java',
  'nav.exportPseudocode': 'Ekspor Pseudokode',
  'nav.canvas': 'Kanvas',
  'nav.arrange': 'Atur',
  'nav.arrangeTitle': 'Susun blok menjadi satu baris vertikal lurus (Alt+Shift+A)',
  'nav.downloadPng': 'Unduh PNG',
  'nav.downloadPngTitle': 'Unduh flowchart sebagai gambar PNG',
  'nav.preferences': 'Preferensi',
  'nav.help': 'Bantuan',
  'nav.menu': 'Menu',
  'nav.helpGuide': 'Panduan',
  'nav.modeHeading': 'Mode',
  'nav.variableModeBeginner': 'Mode Pemula',
  'nav.variableModeBeginnerHint': 'Deklarasikan variabel hanya dengan nilai — tipenya disimpulkan secara otomatis',
  'nav.variableModeStandard': 'Mode Standar',
  'nav.variableModeStandardHint': 'Deklarasikan variabel dengan memilih tipe datanya secara eksplisit',
  'nav.language': 'Bahasa',
  'nav.confirmNew': 'Bersihkan kanvas dan mulai flowchart baru? Tindakan ini tidak bisa dibatalkan.',
  'nav.confirmOpen': 'Bersihkan kanvas dan buka flowchart lain? Tindakan ini tidak bisa dibatalkan.',
  'nav.projectNameLabel': 'Nama proyek',
  'nav.codeHeading': 'Kode',
  'nav.codeIndentHeading': 'Indentasi Kode',
  'nav.codeIndent2': '2 spasi',
  'nav.codeIndent4': '4 spasi',
  'nav.codeIndentTab': 'Karakter tab',
  'nav.codeFontHeading': 'Font Kode',
  'nav.codeFontDefault': 'Bawaan',
  'nav.themeHeading': 'Tema',
  'nav.themeSystem': 'Sistem',
  'nav.themeGroupLight': 'Terang',
  'nav.themeGroupDark': 'Gelap',
  'nav.theme.default': 'Default',
  'nav.theme.warm': 'Hangat',
  'nav.theme.cool': 'Sejuk',
  'nav.theme.nature': 'Alam',

  // ThemeToggle / FullscreenToggle
  'toggle.themeTitle': 'Ganti mode gelap/terang (Alt+Shift+T)',
  'toggle.enterFullscreen': 'Masuk layar penuh',
  'toggle.exitFullscreen': 'Keluar layar penuh',

  // HelpModal
  'help.title': 'Cara Menggunakan KOUDO',
  'help.close': 'Tutup',
  'help.gettingStarted.heading': 'Memulai',
  'help.gettingStarted.body':
    'Seret sebuah blok dari palet (kiri atas kanvas) dan letakkan di bawah Start. Hubungkan blok dengan menyeret dari gagang kecil di bagian bawah satu blok ke bagian atas blok lain — meletakkan blok baru di bagian bawah alur, atau tepat di antara dua blok yang sudah terhubung, akan menghubungkannya secara otomatis.',
  'help.running.heading': 'Menjalankan program',
  'help.running.body':
    'Run, Step, dan Stop berada di atas panel Output. Run menjalankan seluruh program sekaligus — panel Output menampilkan hasil cetaknya. Step menjalankannya satu baris setiap saat, menyorot blok yang sedang dijalankan dan memperbarui tabel Variable Watcher setelah setiap langkah. Keduanya butuh blok End yang sudah terhubung terlebih dahulu.',
  'help.codePanel.heading': 'Panel kode',
  'help.codePanel.body':
    'Tab Java menampilkan flowchart yang diterjemahkan menjadi kelas Java sungguhan yang siap dikompilasi, selalu diperbarui otomatis saat Anda mengedit kanvas — untuk saat ini sifatnya hanya-baca, karena kanvas adalah satu-satunya tempat untuk mengedit di fase ini. Tab Pseudocode menampilkan program yang sama dalam bahasa Inggris terstruktur biasa, hanya untuk dibaca — juga dihasilkan dari flowchart, tidak bisa diedit.',
  'help.variableModes.heading': 'Mode variabel',
  'help.variableModes.body':
    'Ganti mode dari menu Preferences. Mode Standar (default) adalah cara tradisional: Anda memilih tipenya sendiri, dan nilai bersifat opsional. Mode Pemula menyimpulkan tipe variabel dari nilai yang Anda berikan — belum perlu belajar nama-nama tipe. Nilai juga tidak wajib di sana; biarkan kosong dan pilih Bilangan bulat / Teks / Bilangan pecahan sebagai gantinya.',
  'help.menus.heading': 'Menu',
  'help.menus.body':
    'Project — New, Open/Save Project (berkas .kdo), Export Java (berkas .java yang siap dikompilasi, dinamai sesuai proyek), dan Export Pseudocode. Preferences — mode variabel, bahasa, indentasi kode, dan font kode. Canvas — Arrange (merapikan tata letak menjadi kolom-kolom) dan Download PNG. Help — panduan ini, dan Tutorial (putar ulang panduan awal kapan saja). Tombol ☀️/🌙 di kanan atas memilih tema — 4 terang, 4 gelap, atau System.',
  'help.shortcuts.heading': 'Pintasan keyboard',
  'help.shortcuts.run': 'Run',
  'help.shortcuts.step': 'Step / Step Berikutnya',
  'help.shortcuts.arrange': 'Arrange',
  'help.shortcuts.theme': 'Ganti mode gelap / terang',
  'help.shortcuts.undo': 'Urungkan',
  'help.shortcuts.redo': 'Ulangi',
  'help.tips.heading': 'Tips',
  'help.tips.merge': 'Meletakkan blok sejenis di atas blok yang sudah ada akan menggabungkannya menjadi satu blok dengan beberapa baris.',
  'help.tips.rightClick': 'Klik kanan pada blok atau garis penghubung untuk Duplicate atau Delete.',
  'help.tips.fullscreen': 'Tombol ⛶ di kanan atas mengaktifkan/mematikan layar penuh.',
  'help.tips.browserOnly': 'Semuanya berjalan sepenuhnya di browser Anda — apa pun yang Anda buat tidak pernah dikirim ke mana pun.',
  'help.tips.autosave':
    'Pekerjaanmu otomatis tersimpan di browser ini seiring berjalannya waktu — Undo/Redo (kiri atas) mencakup setiap perubahan, termasuk menggeser satu blok.',
  'help.tips.constAndReorder':
    'Di blok Variable, seret gagang ⠿ pada suatu baris untuk mengubah urutannya, dan centang kotaknya untuk menjadikannya konstanta `final` di Java.',
  'help.tips.tutorial': 'Baru di sini? Buka lagi tutorial berpemandu kapan saja lewat Help → Tutorial.',

  // HelpModal — top-level tabs
  'help.tab.koudo': 'Koudo',
  'help.tab.flowchart': 'Flowchart',
  'help.tab.pseudocode': 'Pseudokode',
  'help.tab.java': 'Java',

  // HelpModal — Flowchart tutorial tab
  'help.flowchartTutorial.intro.heading': 'Apa itu flowchart?',
  'help.flowchartTutorial.intro.body':
    'Flowchart adalah diagram yang menampilkan langkah-langkah program sebagai bentuk-bentuk yang saling terhubung, diikuti dari Start hingga End. Setiap bentuk mewakili satu jenis aksi; anak panah menunjukkan urutan menjalankannya.',
  'help.flowchartTutorial.symbols.heading': 'Simbol',
  'help.flowchartTutorial.symbol.terminal.name': 'Terminal (Start / End)',
  'help.flowchartTutorial.symbol.terminal.desc': 'Menandai awal dan akhir program — masing-masing paling banyak satu.',
  'help.flowchartTutorial.symbol.process.name': 'Process',
  'help.flowchartTutorial.symbol.process.desc':
    'Langkah yang melakukan atau mengubah sesuatu — mendeklarasikan variabel, atau memperbarui variabel yang sudah ada.',
  'help.flowchartTutorial.symbol.inputOutput.name': 'Input / Output',
  'help.flowchartTutorial.symbol.inputOutput.desc': 'Membaca nilai dari pengguna, atau mencetak sebuah nilai.',
  'help.flowchartTutorial.symbol.decision.name': 'Decision',
  'help.flowchartTutorial.symbol.decision.desc':
    'Mengajukan pertanyaan true/false dan mengirim alur ke salah satu dari dua jalur tergantung jawabannya.',
  'help.flowchartTutorial.symbol.loop.name': 'Loop',
  'help.flowchartTutorial.symbol.loop.desc': 'Mengulang sekelompok langkah selama suatu kondisi terpenuhi, atau sejumlah kali tertentu.',
  'help.flowchartTutorial.symbol.subroutine.name': 'Predefined Process (Subroutine)',
  'help.flowchartTutorial.symbol.subroutine.desc':
    'Memanggil alur terpisah bernama yang didefinisikan di tempat lain pada kanvas (pasangan Sub Start/Sub End miliknya sendiri) — seperti memanggil method di Java.',
  'help.flowchartTutorial.symbol.arrow.name': 'Anak panah',
  'help.flowchartTutorial.symbol.arrow.desc': 'Menghubungkan dua bentuk dan menunjukkan mana yang dijalankan berikutnya.',
  'help.flowchartTutorial.reading.heading': 'Membaca alur',
  'help.flowchartTutorial.reading.body':
    'Ikuti anak panah selangkah demi selangkah, mulai dari Start. Sebagian besar bentuk menuju tepat satu langkah berikutnya — Decision atau Loop adalah pengecualian, mengirim alur ke jalur berbeda tergantung suatu kondisi, hingga akhirnya bergabung kembali ke jalur utama.',
  'help.flowchartTutorial.example.heading': 'Contoh sederhana',
  'help.flowchartTutorial.example.body':
    'Flowchart yang membaca usia seseorang dan menyatakan apakah ia dewasa: Start, langkah membaca usia dari pengguna, Decision yang bertanya "usia >= 18?", satu jalur mencetak "Dewasa" dan jalur lain "Belum dewasa", keduanya bergabung kembali sebelum End. Membangun persis ini di kanvas — dengan blok Variable, Input, If, dan Output — otomatis menghasilkan Java dan Pseudocode yang tampil di panel Code.',

  // HelpModal — Pseudocode tutorial tab
  'help.pseudocodeTutorial.intro.heading': 'Apa itu pseudocode?',
  'help.pseudocodeTutorial.intro.body':
    'Pseudocode menuliskan logika program dalam bahasa Inggris yang terstruktur dan sederhana, bukan sintaks pasti dari bahasa pemrograman sungguhan — berguna untuk merencanakan atau menjelaskan program tanpa perlu memikirkan aturan compiler. Tab Pseudocode menghasilkannya secara otomatis dari flowchart Anda, dengan satu gaya baku.',
  'help.pseudocodeTutorial.keywords.heading': 'Kata kunci yang digunakan',
  'help.pseudocodeTutorial.keyword.startEnd.desc': 'Batas awal dan akhir seluruh program.',
  'help.pseudocodeTutorial.keyword.declare.desc':
    'Memperkenalkan variabel baru — tambahkan "= nilai" setelah tipe untuk memberi nilai awal.',
  'help.pseudocodeTutorial.keyword.input.desc': 'Membaca nilai dari pengguna ke dalam x.',
  'help.pseudocodeTutorial.keyword.output.desc': 'Mencetak sebuah nilai.',
  'help.pseudocodeTutorial.keyword.assign.desc':
    'Menetapkan nilai baru ke x — +=, -=, *=, atau /= milik Java dituliskan dengan cara yang sama, misalnya "x = x + nilai".',
  'help.pseudocodeTutorial.keyword.if.desc': 'Bercabang berdasarkan sebuah kondisi; ELSE bersifat opsional.',
  'help.pseudocodeTutorial.keyword.for.desc': 'Perulangan dengan penghitung — init, kondisi, dan update, ide yang sama seperti for di Java.',
  'help.pseudocodeTutorial.keyword.while.desc': 'Mengulang isinya selama kondisinya masih terpenuhi.',
  'help.pseudocodeTutorial.keyword.subroutine.desc':
    'Mendefinisikan sekelompok langkah terpisah dan bernama yang bisa dipanggil dari tempat lain — seperti method di Java.',
  'help.pseudocodeTutorial.keyword.call.desc': 'Menjalankan SUBROUTINE yang didefinisikan di tempat lain, lalu lanjut tepat setelah baris ini.',
  'help.pseudocodeTutorial.keyword.return.desc':
    'Mengakhiri jalannya SUBROUTINE yang bukan void dan mengirim nilai ini kembali ke tempat ia dipanggil.',
  'help.pseudocodeTutorial.example.heading': 'Contoh',

  // HelpModal — Java tutorial tab (sub-tabs)
  'help.javaTutorial.dataTypes.label': 'Tipe Data',
  'help.javaTutorial.dataTypes.body':
    'Setiap variabel di Java memiliki tipe data, ditetapkan saat dideklarasikan. Aplikasi ini mendukung: int dan long untuk bilangan bulat, double dan float untuk bilangan pecahan, boolean untuk true/false, char untuk satu karakter, dan String untuk teks.',
  'help.javaTutorial.variables.label': 'Variabel',
  'help.javaTutorial.variables.body':
    'Variabel adalah kotak bernama yang menyimpan nilai sesuai tipe yang dideklarasikan. Deklarasikan sekali dengan `tipe nama = nilai;` (atau cukup `tipe nama;` untuk mendeklarasikan tanpa nilai awal), lalu baca atau ubah nilainya lewat namanya di mana pun setelah itu.',
  'help.javaTutorial.operators.label': 'Operator',
  'help.javaTutorial.operators.body':
    'Aritmetika: + - * / % (sisa bagi). Perbandingan: == != < > <= >= — dipakai dalam kondisi Decision atau perulangan, selalu menghasilkan boolean. Logika: && (dan), || (atau), ! (bukan), untuk menggabungkan kondisi. Penetapan nilai: = untuk menetapkan nilai, dan +=, -=, *=, /= sebagai jalan pintas untuk "perbarui berdasarkan nilai saat ini".',
  'help.javaTutorial.inputOutput.label': 'Input / Output',
  'help.javaTutorial.inputOutput.body':
    'System.out.println(nilai) mencetak sebuah nilai, diikuti baris baru. Membaca input membutuhkan Scanner — Scanner scanner = new Scanner(System.in); — lalu metode yang sesuai dengan tipe yang dibaca: nextInt() untuk int, nextDouble() untuk double, next() untuk satu kata teks, dan seterusnya.',
  'help.javaTutorial.conditionals.label': 'Percabangan',
  'help.javaTutorial.conditionals.body':
    'Pernyataan if menjalankan sebuah blok hanya ketika kondisinya true; else opsional dijalankan sebagai gantinya ketika kondisinya false. Tambahkan pemeriksaan lain dengan else if.',
  'help.javaTutorial.loops.label': 'Perulangan',
  'help.javaTutorial.loops.body':
    'Perulangan for berulang sebanyak jumlah tertentu — tanda kurungnya berisi init (dijalankan sekali), kondisi (diperiksa sebelum setiap putaran), dan update (dijalankan setelah setiap putaran). Perulangan while berulang selama kondisinya masih terpenuhi, tanpa penghitung bawaan.',

  // OutputPanel
  'output.run': '▶ Run',
  'output.step': '⏭ Step',
  'output.nextStep': '⏭ Step Berikutnya',
  'output.stop': '⏹ Stop',
  'output.runTitleEnabled': 'Jalankan kode (Alt+Shift+R) — output muncul di bawah',
  'output.runTitleDisabled': 'Hubungkan blok End ke flowchart sebelum menjalankan',
  'output.runTitleIfIncomplete': 'Setiap blok if harus punya cabang true dan false yang sama-sama berakhir di blok End',
  'output.stepTitleNoStart': 'Tambahkan blok Start terlebih dahulu',
  'output.stepTitleNoEnd': 'Hubungkan blok End ke flowchart sebelum melakukan step',
  'output.stepTitleIfIncomplete': 'Setiap blok if harus punya cabang true dan false yang sama-sama berakhir di blok End',
  'output.stepTitleReady': 'Jalankan satu baris setiap saat, menyorot setiap blok di kanvas (Alt+Shift+S)',
  'output.nextStepTitle': 'Jalankan baris berikutnya (Alt+Shift+S)',
  'output.heading': 'Output',
  'output.clear': 'Bersihkan',
  'output.clearTitleStepping': 'Hentikan step run untuk membersihkan output',
  'output.clearTitleReady': 'Bersihkan output',
  'output.line': 'Baris {index}/{total}:',
  'output.emptyPrompt': 'Klik {run}, atau {step}, di atas untuk melihat output di sini.',
  'output.noOutput': '(tidak ada output)',
  'output.variables': 'Variabel',
  'output.noVariablesRun': 'Tidak ada variabel',
  'output.noVariablesPrompt': 'Jalankan program untuk melihat variabel di sini',

  // CodeEditorPanel
  'code.pseudocodeTab': 'Pseudokode',
  'code.javaTab': 'Java',
  'code.decreaseTextSize': 'Perkecil ukuran teks',
  'code.increaseTextSize': 'Perbesar ukuran teks',
  'code.copy': 'Salin kode',
  'code.copied': 'Disalin ke clipboard',
  'code.copyFailed': 'Gagal menyalin ke clipboard',

  // Toast
  'toast.dismiss': 'Tutup',
  'toast.couldNotPlaceBlock': 'Blok tidak bisa diletakkan: {error}',
  'toast.needsDeclaredVariableInput':
    'Deklarasikan variabel sebelum menambahkan blok Input — blok ini membutuhkan variabel yang sudah ada untuk membaca nilai ke dalamnya.',
  'toast.needsDeclaredVariableAssign':
    'Deklarasikan variabel sebelum menambahkan blok Assign — blok ini membutuhkan variabel yang sudah ada untuk diberi nilai.',

  // CanvasContextMenu
  'contextMenu.duplicate': 'Duplikat',
  'contextMenu.delete': 'Hapus',

  // BlockPalette
  'palette.heading': 'Blok',
  'palette.expand': 'Perluas palet blok',
  'palette.minimize': 'Perkecil palet blok',
  'palette.chipAlreadyOnCanvas': '{label} — sudah ada di kanvas',
  'palette.chipComingSoon': '{label} — segera hadir',
  'palette.chipDragHint': 'Seret ke kanvas untuk menambahkan blok {label}',
  'palette.comingSoonSuffix': ' (segera)',

  // Block type display names
  'block.type.start': 'Mulai',
  'block.type.end': 'Selesai',
  'block.type.declare': 'Variabel',
  'block.type.assign': 'Ubah Nilai',
  'block.type.input': 'Input',
  'block.type.process': 'Output',
  'block.type.decision': 'If',
  'block.type.forLoop': 'For',
  'block.type.whileLoop': 'While',
  'block.type.subroutineStart': 'Awal Sub',
  'block.type.subroutineCall': 'Panggil Sub',
  'block.type.subroutineEnd': 'Akhir Sub',

  // Subroutine Start/Call/End blocks
  'subroutineStart.label': 'Sub',
  'subroutineStart.namePlaceholder': 'nama',
  'subroutineStart.invalidName': '"{name}" bukan nama method Java yang valid',
  'subroutineStart.returnsLabel': 'Kembalikan',
  'subroutineStart.parametersLabel': 'Parameter',
  'subroutineStart.paramPlaceholder': 'param',
  'subroutineStart.addParam': '+ Tambah parameter',
  'subroutineStart.removeParam': 'Hapus parameter',
  'subroutineEnd.label': 'Akhir',
  'subroutineEnd.returnLabel': 'Nilai balik',
  'subroutineCall.label': 'Panggil',
  'subroutineCall.noSubroutines': 'Belum ada subroutine',
  'subroutineCall.discardResult': '(abaikan hasil)',

  // Shared "no variables yet" / "choose" dropdown prompt
  'shared.noVariables': 'Tidak ada variabel',
  'shared.choose': 'Pilih',
  'shared.value': 'Nilai',
  'shared.indexPlaceholder': 'indeks',
  'shared.indexTitle': 'Indeks larik (angka atau ekspresi seperti i)',
  'shared.dragToReorder': 'Seret untuk mengubah urutan',

  // DeclareNode
  'declare.name': 'Nama',
  'declare.nameTitle': 'Nama variabel',
  'declare.valueOptional': 'Nilai',
  'declare.valueTitle': 'Nilai awal variabel',
  'declare.typeWhole': 'Bilangan bulat',
  'declare.typeDecimal': 'Bilangan pecahan',
  'declare.typeText': 'Teks',
  'declare.typeTitle': 'Tidak ada nilai — pilih tipe variabel ini',
  'declare.invalidName': "'{name}' bukan nama variabel Java yang valid",
  'declare.remove': 'Hapus variabel ini',
  'declare.add': '+ Tambah variabel',
  'declare.constTitle': 'Konstanta (final di Java — tidak bisa diubah ulang)',
  'declare.arrayLabel': 'Larik',
  'declare.arrayValuePlaceholder': 'ukuran, mis. 5, atau 1,2,3',
  'declare.arrayValueHint': 'Angka menentukan ukuran (mis. 5); daftar dipisah koma menentukan isi elemen (mis. 1,2,3)',

  // AssignNode
  'assign.valueOrLiteral': '"teks" atau 5',
  'assign.customValue': '✎ Nilai',
  'assign.remove': 'Hapus penetapan nilai ini',
  'assign.add': '+ Tambah penetapan nilai',

  // InputNode
  'input.label': 'Input',
  'input.prompt': 'Prompt',
  'input.remove': 'Hapus input ini',
  'input.add': '+ Tambah input',

  // ProcessNode (Output block)
  'process.print': 'Cetak',
  'process.newlineTitle': 'Pindah baris baru setelah mencetak',
  'process.customValue': '✎ Nilai',
  'process.valueOrLiteralInferred': 'Nilai',
  'process.valueOrLiteral': '"teks" atau 5',
  'process.removeLine': 'Hapus baris ini',
  'process.add': '+ Tambah output',

  // DecisionNode / WhileLoopNode / ForLoopNode
  'flow.condition': 'Kondisi',
  'flow.conditionTitle': 'Kondisi — diperiksa sebelum setiap perulangan',
  'flow.initTitle': 'Init — dijalankan sekali, sebelum perulangan dimulai',
  'flow.updateTitle': 'Update — dijalankan setelah setiap iterasi isi perulangan',
  'flow.loopLabel': 'loop',
  'flow.exitLabel': 'keluar',

  // FlowchartBoard
  'flowchart.canvasAriaLabel': 'Kanvas flowchart — letakkan blok di sini',

  // App.svelte
  'app.resizeColumnsAriaLabel': 'Ubah ukuran panel flowchart dan kode',
  'app.resizeRowAriaLabel': 'Ubah ukuran panel output',
  'app.showCodePanel': 'Tampilkan panel kode',
  'app.hideCodePanel': 'Sembunyikan panel kode',

  // TutorialWelcomeModal — shown once, automatically, on a first visit
  'welcome.title': 'Selamat datang di KOUDO! 👋',
  'welcome.body':
    'KOUDO mengubah flowchart yang kamu buat menjadi kode Java yang benar-benar bisa dijalankan. Pilih bahasa di bawah, lalu mari kita buat program pertamamu bersama — mendeklarasikan variabel dan menampilkannya.',
  'welcome.languageLabel': 'Bahasa',
  'welcome.start': 'Mulai Tutorial',
  'welcome.skip': 'Lewati',

  // TutorialCoach — bisa dibuka lagi kapan saja dari submenu Tutorial di
  // menu Bantuan (lihat TopNavbar.svelte's nav.tutorial / stores/tutorial.ts)
  'tutorial.dragToMove': 'Seret untuk memindahkan',
  'tutorial.back': 'Kembali',
  'tutorial.next': 'Lanjut',
  'tutorial.skip': 'Lewati tutorial',
  'tutorial.finish': 'Selesai',
  'tutorial.stepOf': 'Langkah {index} dari {total}',

  // Pemilih panduan (menu Bantuan -> submenu Tutorial) — "basic" adalah
  // satu-satunya yang ditampilkan otomatis untuk pengunjung baru (lihat
  // tutorial.ts's startTutorial); sisanya opsional.
  'tutorial.track.basic': 'Dasar: Deklarasi & Tampilkan',
  'tutorial.track.variableConstAssignment': 'Variabel, Konstanta & Assignment',
  'tutorial.track.inputOutput': 'Input & Output',
  'tutorial.track.decision': 'Keputusan (If)',
  'tutorial.track.forLoop': 'Perulangan For',
  'tutorial.track.whileLoop': 'Perulangan While',
  'tutorial.track.subroutine': 'Subroutine (Sub Start/End/Call)',

  // Panduan Dasar
  'tutorial.step.basic.welcome.title': 'Mari membuat sesuatu!',
  'tutorial.step.basic.welcome.body':
    'Di sebelah kiri ada kanvasmu — buat flowchart dengan menyeret blok dari palet. Di sebelah kanan, KOUDO otomatis mengubahnya menjadi Pseudocode dan kode Java sungguhan. Kita akan mendeklarasikan sebuah variabel dan menampilkannya.',
  'tutorial.step.basic.declareName.title': 'Deklarasikan variabel',
  'tutorial.step.basic.declareName.body':
    'Seret blok \'Variable\' dari palet ke kanvas. Beri nama `nama` dan isi nilainya seperti `"Andi"` (pakai tanda kutip, karena ini teks).',
  'tutorial.step.basic.output.title': 'Tampilkan',
  'tutorial.step.basic.output.body': "Seret blok 'Output' ke kanvas, lalu tambahkan `nama` sebagai variabel yang dicetak.",
  'tutorial.step.basic.end.title': 'Selesaikan alurnya',
  'tutorial.step.basic.end.body': "Seret blok 'End' ke kanvas untuk menyelesaikan programmu.",
  'tutorial.step.basic.arrange.title': 'Rapikan tata letak',
  'tutorial.step.basic.arrange.body':
    "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu menjadi satu baris lurus.",
  'tutorial.step.basic.run.title': 'Jalankan!',
  'tutorial.step.basic.run.body': 'Klik ▶ Run di bawah kanvas. Hasil yang diharapkan: `Andi`',
  'tutorial.step.basic.done.title': '🎉 Berhasil!',
  'tutorial.step.basic.done.body':
    'Kamu baru saja mendeklarasikan variabel dan menampilkannya dengan KOUDO. Buka Bantuan → Tutorial untuk mencoba panduan lain: konstanta & perhitungan, input, keputusan, dan perulangan.',

  // Panduan Variabel, Konstanta & Assignment — langkah menghitung luas lingkaran
  'tutorial.step.vca.welcome.title': 'Mari membuat sesuatu!',
  'tutorial.step.vca.welcome.body':
    'Di sebelah kiri ada kanvasmu — buat flowchart dengan menyeret blok dari palet. Di sebelah kanan, KOUDO otomatis mengubahnya menjadi Pseudocode dan kode Java sungguhan. Kita akan menghitung luas lingkaran: `luas = π × jari-jari²`.',
  'tutorial.step.vca.declareRadius.title': 'Deklarasikan variabel',
  'tutorial.step.vca.declareRadius.body':
    "Seret blok 'Variable' dari palet ke kanvas. Beri nama `radius` dan isi nilainya, misalnya `5`.",
  'tutorial.step.vca.declarePi.title': 'Tambahkan konstanta',
  'tutorial.step.vca.declarePi.body':
    "Di blok yang sama, klik '+ Tambah variabel'. Centang kotak const, beri nama `PI`, dan isi nilainya `3.14` — konstanta tidak bisa diubah lagi setelahnya.",
  'tutorial.step.vca.declareArea.title': 'Satu variabel lagi',
  'tutorial.step.vca.declareArea.body':
    "Klik '+ Tambah variabel' sekali lagi. Beri nama `area`, atur tipenya ke `double` (bilangan pecahan), dan biarkan nilainya kosong dulu — kita akan menghitungnya di langkah berikutnya.",
  'tutorial.step.vca.assign.title': 'Hitung luasnya',
  'tutorial.step.vca.assign.body': "Seret blok 'Assign' ke kanvas. Atur: `area = PI * radius * radius`",
  'tutorial.step.vca.output.title': 'Tampilkan hasilnya',
  'tutorial.step.vca.output.body': "Seret blok 'Output' ke kanvas, lalu tambahkan `area` sebagai variabel yang dicetak.",
  'tutorial.step.vca.end.title': 'Selesaikan alurnya',
  'tutorial.step.vca.end.body': "Seret blok 'End' ke kanvas untuk menyelesaikan programmu.",
  'tutorial.step.vca.arrange.title': 'Rapikan tata letak',
  'tutorial.step.vca.arrange.body': "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu menjadi satu baris lurus.",
  'tutorial.step.vca.run.title': 'Jalankan!',
  'tutorial.step.vca.run.body':
    'Klik ▶ Run di bawah kanvas untuk menghitung dan menampilkan luas lingkarannya. Dengan `radius = 5` dan `PI = 3.14`, hasil yang diharapkan: `78.5`',
  'tutorial.step.vca.done.title': '🎉 Berhasil!',
  'tutorial.step.vca.done.body':
    'Kamu baru saja mendeklarasikan variabel, memakai konstanta, menghitung sebuah nilai, dan menjalankan program pertamamu di KOUDO. Buka Bantuan → Tutorial untuk mencoba panduan lain: input, keputusan, dan perulangan.',

  // Panduan Input & Output
  'tutorial.step.io.welcome.title': 'Ajak programmu bicara',
  'tutorial.step.io.welcome.body':
    "Panduan ini menambahkan blok 'Input' sehingga flowchart-mu bisa menanyakan sesuatu saat dijalankan, lalu menampilkan jawabannya lewat 'Output'.",
  'tutorial.step.io.declareVar.title': 'Deklarasikan variabel',
  'tutorial.step.io.declareVar.body':
    "Seret blok 'Variable' ke kanvas. Beri nama `nama`, atur tipenya ke `String`, dan biarkan nilainya kosong — Input akan mengisinya saat program dijalankan.",
  'tutorial.step.io.input.title': 'Minta input',
  'tutorial.step.io.input.body':
    "Seret blok 'Input' ke kanvas. Pilih `nama` dari dropdown, dan atur promptnya seperti `Siapa namamu?`",
  'tutorial.step.io.output.title': 'Tampilkan kembali',
  'tutorial.step.io.output.body': "Seret blok 'Output' ke kanvas, lalu tambahkan `nama` sebagai variabel yang dicetak.",
  'tutorial.step.io.end.title': 'Selesaikan alurnya',
  'tutorial.step.io.end.body': "Seret blok 'End' ke kanvas untuk menyelesaikan programmu.",
  'tutorial.step.io.arrange.title': 'Rapikan tata letak',
  'tutorial.step.io.arrange.body': "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu menjadi satu baris lurus.",
  'tutorial.step.io.run.title': 'Jalankan!',
  'tutorial.step.io.run.body':
    'Klik ▶ Run di bawah kanvas. Saat ditanya, ketik namamu lalu tekan Enter — KOUDO langsung menampilkannya kembali.',
  'tutorial.step.io.done.title': '🎉 Berhasil!',
  'tutorial.step.io.done.body':
    'Kamu baru saja membaca nilai saat program berjalan dan menampilkannya. Buka Bantuan → Tutorial untuk mencoba keputusan dan perulangan selanjutnya.',

  // Panduan Keputusan (If)
  'tutorial.step.decision.welcome.title': 'Buat sebuah pilihan',
  'tutorial.step.decision.welcome.body':
    "Panduan ini mencabangkan alurmu dengan blok 'If' — kita akan memeriksa apakah sebuah angka genap atau ganjil.",
  'tutorial.step.decision.declareNumber.title': 'Deklarasikan variabel',
  'tutorial.step.decision.declareNumber.body':
    "Seret blok 'Variable' ke kanvas. Beri nama `angka`, atur tipenya ke `int`, dan isi nilainya, misalnya `7`.",
  'tutorial.step.decision.decision.title': 'Tambahkan pemeriksaan',
  'tutorial.step.decision.decision.body': "Seret blok 'If' ke kanvas. Atur kondisinya ke `angka % 2 == 0`.",
  'tutorial.step.decision.outputEven.title': 'Cabang: True',
  'tutorial.step.decision.outputEven.body':
    "Dari cabang True blok 'If', seret blok 'Output' dan cetak teks kustom `Genap`.",
  'tutorial.step.decision.outputOdd.title': 'Cabang: False',
  'tutorial.step.decision.outputOdd.body':
    "Dari cabang False blok 'If', seret blok 'Output' lagi dan cetak teks kustom `Ganjil`.",
  'tutorial.step.decision.end.title': 'Selesaikan alurnya',
  'tutorial.step.decision.end.body': "Seret satu blok 'End' dan hubungkan kedua blok Output ke sana.",
  'tutorial.step.decision.arrange.title': 'Rapikan tata letak',
  'tutorial.step.decision.arrange.body': "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu.",
  'tutorial.step.decision.run.title': 'Jalankan!',
  'tutorial.step.decision.run.body': 'Klik ▶ Run di bawah kanvas. Dengan `angka = 7`, hasil yang diharapkan: `Ganjil`',
  'tutorial.step.decision.done.title': '🎉 Berhasil!',
  'tutorial.step.decision.done.body':
    'Kamu baru saja mencabangkan alur programmu dengan sebuah kondisi. Buka Bantuan → Tutorial untuk mencoba perulangan For dan While selanjutnya.',

  // Panduan Perulangan For
  'tutorial.step.forLoop.welcome.title': 'Ulangi dirimu sendiri',
  'tutorial.step.forLoop.welcome.body':
    "Panduan ini memakai blok 'For' untuk mengulang sebuah langkah sejumlah kali yang tetap — kita akan menghitung dari 1 sampai 5.",
  'tutorial.step.forLoop.forLoop.title': 'Tambahkan perulangan',
  'tutorial.step.forLoop.forLoop.body': "Seret blok 'For' ke kanvas. Atur: init `int i = 1`, kondisi `i <= 5`, update `i++`.",
  'tutorial.step.forLoop.output.title': 'Cetak setiap angka',
  'tutorial.step.forLoop.output.body':
    "Seret blok 'Output' dari handle bawah perulangan dan cetak `i`. Lalu hubungkan bagian bawahnya kembali ke blok 'For' untuk menutup perulangan.",
  'tutorial.step.forLoop.end.title': 'Selesaikan alurnya',
  'tutorial.step.forLoop.end.body': "Seret blok 'End' dan hubungkan ke cabang lain perulangan (exit, di sebelah kanan).",
  'tutorial.step.forLoop.arrange.title': 'Rapikan tata letak',
  'tutorial.step.forLoop.arrange.body': "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu.",
  'tutorial.step.forLoop.run.title': 'Jalankan!',
  'tutorial.step.forLoop.run.body': 'Klik ▶ Run di bawah kanvas. Hasil yang diharapkan: `1` sampai `5`, masing-masing di barisnya sendiri.',
  'tutorial.step.forLoop.done.title': '🎉 Berhasil!',
  'tutorial.step.forLoop.done.body':
    'Kamu baru saja mengulang sebuah langkah dengan perulangan For. Buka Bantuan → Tutorial untuk mencoba perulangan While selanjutnya.',

  // Panduan Perulangan While
  'tutorial.step.whileLoop.welcome.title': 'Ulangi dengan penghitungmu sendiri',
  'tutorial.step.whileLoop.welcome.body':
    "Panduan ini memakai blok 'While', yang berulang selama sebuah kondisi masih benar — kamu mengatur sendiri penghitungnya. Kita akan menghitung dari 1 sampai 5.",
  'tutorial.step.whileLoop.declareCounter.title': 'Deklarasikan penghitung',
  'tutorial.step.whileLoop.declareCounter.body':
    "Seret blok 'Variable' ke kanvas. Beri nama `i`, atur tipenya ke `int`, dan isi nilainya `1`.",
  'tutorial.step.whileLoop.whileLoop.title': 'Tambahkan perulangan',
  'tutorial.step.whileLoop.whileLoop.body': "Seret blok 'While' ke kanvas. Atur kondisinya ke `i <= 5`.",
  'tutorial.step.whileLoop.output.title': 'Cetak penghitungnya',
  'tutorial.step.whileLoop.output.body': "Dari cabang 'loop' perulangan (bawah), seret blok 'Output' dan cetak `i`.",
  'tutorial.step.whileLoop.assignIncrement.title': 'Naikkan penghitungnya',
  'tutorial.step.whileLoop.assignIncrement.body':
    "Seret blok 'Assign' setelah Output. Atur: `i = i + 1`. Lalu hubungkan kembali ke blok 'While' untuk menutup perulangan.",
  'tutorial.step.whileLoop.end.title': 'Selesaikan alurnya',
  'tutorial.step.whileLoop.end.body': "Seret blok 'End' dan hubungkan ke cabang 'exit' perulangan (di sebelah kanan).",
  'tutorial.step.whileLoop.arrange.title': 'Rapikan tata letak',
  'tutorial.step.whileLoop.arrange.body': "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu.",
  'tutorial.step.whileLoop.run.title': 'Jalankan!',
  'tutorial.step.whileLoop.run.body':
    'Klik ▶ Run di bawah kanvas. Hasil yang diharapkan: `1` sampai `5`, masing-masing di barisnya sendiri.',
  'tutorial.step.whileLoop.done.title': '🎉 Berhasil!',
  'tutorial.step.whileLoop.done.body':
    'Kamu baru saja mengulang sebuah langkah dengan perulangan While dan mengatur penghitung sendiri. Buka Bantuan → Tutorial untuk mencoba Subroutine selanjutnya.',

  // Panduan Subroutine
  'tutorial.step.subroutine.welcome.title': 'Gunakan ulang langkah dengan subroutine',
  'tutorial.step.subroutine.welcome.body':
    'Subroutine adalah alur kecil yang bisa kamu panggil dari alur utama, dengan nama, parameter, dan (opsional) nilai balik sendiri — seperti method Java. Kita akan membuat subroutine yang mengkuadratkan sebuah angka.',
  'tutorial.step.subroutine.mode.title': 'Ganti ke Mode Standar',
  'tutorial.step.subroutine.mode.body':
    "Blok subroutine hanya muncul di Mode Standar. Buka Preferensi → Mode lalu pilih 'Mode Standar' sebelum melanjutkan.",
  'tutorial.step.subroutine.subroutineStart.title': 'Mulai subroutine-nya',
  'tutorial.step.subroutine.subroutineStart.body':
    "Seret blok 'Sub Start' ke kanvas. Beri nama `square`, atur 'Returns' ke `int`, lalu klik '+ Tambah parameter' dan atur ke `int` `n`.",
  'tutorial.step.subroutine.subroutineReturn.title': 'Kembalikan sebuah nilai',
  'tutorial.step.subroutine.subroutineReturn.body':
    "Seret blok 'Sub End' di bawahnya lalu hubungkan keduanya. Atur kolom 'Nilai balik' ke `n * n`.",
  'tutorial.step.subroutine.mainDeclare.title': 'Deklarasikan variabel untuk hasilnya',
  'tutorial.step.subroutine.mainDeclare.body':
    "Kembali ke alur utama (dari blok 'Start' biasa), seret blok 'Variable'. Beri nama `result`, tipe `int`.",
  'tutorial.step.subroutine.subroutineCall.title': 'Panggil subroutine-nya',
  'tutorial.step.subroutine.subroutineCall.body':
    "Seret blok 'Call Sub' setelahnya. Pilih dulu `square` sebagai subroutine-nya — dropdown hasil akan muncul di sebelah kiri, atur ke `result`. Baru kemudian atur argumennya ke `5`.",
  'tutorial.step.subroutine.output.title': 'Cetak hasilnya',
  'tutorial.step.subroutine.output.body': "Seret blok 'Output' dan cetak `result`.",
  'tutorial.step.subroutine.end.title': 'Selesaikan alur utamanya',
  'tutorial.step.subroutine.end.body': "Seret blok 'End' dan hubungkan setelah Output.",
  'tutorial.step.subroutine.arrange.title': 'Rapikan tata letak',
  'tutorial.step.subroutine.arrange.body': "Buka menu 'Canvas' di atas, lalu pilih 'Atur' untuk merapikan blok-blokmu.",
  'tutorial.step.subroutine.run.title': 'Jalankan!',
  'tutorial.step.subroutine.run.body': 'Klik ▶ Run di bawah kanvas. Hasil yang diharapkan: `25`.',
  'tutorial.step.subroutine.done.title': '🎉 Berhasil!',
  'tutorial.step.subroutine.done.body':
    "Kamu baru saja membuat dan memanggil subroutine sendiri dengan parameter dan nilai balik. Cek tab 'Java' untuk melihat method yang dihasilkan, siap dikompilasi. Jelajahi palet untuk lainnya.",

  // TopNavbar — membuka tutorial di atas lagi
  'nav.tutorial': 'Tutorial',
};

export const translations = { en, id };
