// Flat key -> template string, one object per language. Every value can
// carry {placeholder} tokens (see stores/i18n.ts's interpolate()) — plain
// strings just have none. `en` is the source of truth for which keys exist
// (TranslationKey is derived from it); `id` is typed against the exact same
// key set so a missing Indonesian translation is a compile error, not a
// silent English fallback discovered by clicking around.
//
// Deliberately NOT translated here: Java type keywords (int/double/String/
// boolean/...), true/false literals, generated Java/Pseudocode output, and
// Start/End's own on-canvas text (see stores/flowchart.ts's XYFLOW_NODE_TYPE
// — they're xyflow's built-in node types, rendered from a label baked into
// node data at creation time rather than read reactively, so they can't
// follow a language switch without becoming custom components). For/While/
// True/False are also left as-is — borrowed CS terms usually kept in
// English even in Indonesian programming instruction, same reasoning as the
// type keywords.
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
  'nav.variableModeBeginner': 'Beginner Mode',
  'nav.variableModeBeginnerHint': "Declare a variable with just a value — its type is inferred automatically",
  'nav.variableModeStandard': 'Standard Mode',
  'nav.variableModeStandardHint': 'Declare a variable by choosing its data type explicitly',
  'nav.language': 'Language',
  'nav.confirmNew': 'Clear the canvas and start a new flowchart? This cannot be undone.',
  'nav.confirmOpen': 'Clear the canvas and open a different flowchart? This cannot be undone.',
  'nav.projectNameLabel': 'Project name',
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
    'Switch modes from the Project menu. Standard Mode (the default) is the traditional way: you pick the type yourself, and a value is optional. Beginner Mode infers a variable\'s type from the value you give it — no type names to learn yet. A value isn\'t required there either; leave it blank and pick Whole number / Text / Decimal number instead.',
  'help.menus.heading': 'Menus',
  'help.menus.body':
    'Project — New, Open/Save Project, Export Java (a compilable .java file named after the project), and Export Pseudocode. Preferences — variable mode and language. Canvas — Arrange (tidy the layout into columns) and Download PNG.',
  'help.shortcuts.heading': 'Keyboard shortcuts',
  'help.shortcuts.run': 'Run',
  'help.shortcuts.step': 'Step / Next Step',
  'help.shortcuts.arrange': 'Arrange',
  'help.shortcuts.theme': 'Toggle dark / light mode',
  'help.tips.heading': 'Tips',
  'help.tips.merge': 'Dropping a block of the same kind onto an existing one merges them into a single block with multiple lines.',
  'help.tips.rightClick': 'Right-click a block or a connecting line to Duplicate or Delete it.',
  'help.tips.fullscreen': 'The ⛶ button, top-right, toggles fullscreen.',
  'help.tips.browserOnly': 'Everything runs entirely in your browser — nothing you build is ever sent anywhere.',

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
  'output.stepTitleNoStart': 'Add a Start block first',
  'output.stepTitleNoEnd': 'Connect an End block to the flowchart before stepping',
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

  // Block type display names (Start/End excluded — see file header comment)
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
  // Assign's String/char field) — distinct from declare.valueOptional,
  // which also says "(optional)".
  'shared.value': 'Value',

  // DeclareNode
  'declare.name': 'Name',
  'declare.valueOptional': 'Value (optional)',
  'declare.typeWhole': 'Whole number',
  'declare.typeDecimal': 'Decimal number',
  'declare.typeText': 'Text',
  'declare.typeTitle': "No value given — choose this variable's type",
  'declare.invalidName': "'{name}' is not a valid Java variable name",
  'declare.remove': 'Remove this variable',
  'declare.add': '+ Add variable',
  'declare.moveUp': 'Move this variable up',
  'declare.moveDown': 'Move this variable down',
  'declare.constTitle': 'Constant (Java final — cannot be reassigned)',

  // AssignNode
  'assign.valueOrLiteral': '"text" or 5',
  'assign.customValue': '✎ Value',
  'assign.remove': 'Remove this assignment',
  'assign.add': '+ Add assignment',

  // InputNode
  'input.label': 'Input',
  'input.prompt': 'Prompt (optional)',
  'input.remove': 'Remove this input',
  'input.add': '+ Add input',

  // ProcessNode (Output block)
  'process.print': 'Print',
  'process.customValue': '✎ Value',
  'process.valueOrLiteralInferred': 'text or 5',
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
  'nav.variableModeBeginner': 'Mode Pemula',
  'nav.variableModeBeginnerHint': 'Deklarasikan variabel hanya dengan nilai — tipenya disimpulkan secara otomatis',
  'nav.variableModeStandard': 'Mode Standar',
  'nav.variableModeStandardHint': 'Deklarasikan variabel dengan memilih tipe datanya secara eksplisit',
  'nav.language': 'Bahasa',
  'nav.confirmNew': 'Bersihkan kanvas dan mulai flowchart baru? Tindakan ini tidak bisa dibatalkan.',
  'nav.confirmOpen': 'Bersihkan kanvas dan buka flowchart lain? Tindakan ini tidak bisa dibatalkan.',
  'nav.projectNameLabel': 'Nama proyek',
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
    'Ganti mode dari menu Project. Mode Standar (default) adalah cara tradisional: Anda memilih tipenya sendiri, dan nilai bersifat opsional. Mode Pemula menyimpulkan tipe variabel dari nilai yang Anda berikan — belum perlu belajar nama-nama tipe. Nilai juga tidak wajib di sana; biarkan kosong dan pilih Bilangan bulat / Teks / Bilangan pecahan sebagai gantinya.',
  'help.menus.heading': 'Menu',
  'help.menus.body':
    'Project — New, Open/Save Project, Export Java (berkas .java yang siap dikompilasi, dinamai sesuai proyek), dan Export Pseudocode. Preferences — mode variabel dan bahasa. Canvas — Arrange (merapikan tata letak menjadi kolom-kolom) dan Download PNG.',
  'help.shortcuts.heading': 'Pintasan keyboard',
  'help.shortcuts.run': 'Run',
  'help.shortcuts.step': 'Step / Step Berikutnya',
  'help.shortcuts.arrange': 'Arrange',
  'help.shortcuts.theme': 'Ganti mode gelap / terang',
  'help.tips.heading': 'Tips',
  'help.tips.merge': 'Meletakkan blok sejenis di atas blok yang sudah ada akan menggabungkannya menjadi satu blok dengan beberapa baris.',
  'help.tips.rightClick': 'Klik kanan pada blok atau garis penghubung untuk Duplicate atau Delete.',
  'help.tips.fullscreen': 'Tombol ⛶ di kanan atas mengaktifkan/mematikan layar penuh.',
  'help.tips.browserOnly': 'Semuanya berjalan sepenuhnya di browser Anda — apa pun yang Anda buat tidak pernah dikirim ke mana pun.',

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
  'output.stepTitleNoStart': 'Tambahkan blok Start terlebih dahulu',
  'output.stepTitleNoEnd': 'Hubungkan blok End ke flowchart sebelum melakukan step',
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

  // DeclareNode
  'declare.name': 'Nama',
  'declare.valueOptional': 'Nilai (opsional)',
  'declare.typeWhole': 'Bilangan bulat',
  'declare.typeDecimal': 'Bilangan pecahan',
  'declare.typeText': 'Teks',
  'declare.typeTitle': 'Tidak ada nilai — pilih tipe variabel ini',
  'declare.invalidName': "'{name}' bukan nama variabel Java yang valid",
  'declare.remove': 'Hapus variabel ini',
  'declare.add': '+ Tambah variabel',
  'declare.moveUp': 'Pindahkan variabel ini ke atas',
  'declare.moveDown': 'Pindahkan variabel ini ke bawah',
  'declare.constTitle': 'Konstanta (final di Java — tidak bisa diubah ulang)',

  // AssignNode
  'assign.valueOrLiteral': '"teks" atau 5',
  'assign.customValue': '✎ Nilai',
  'assign.remove': 'Hapus penetapan nilai ini',
  'assign.add': '+ Tambah penetapan nilai',

  // InputNode
  'input.label': 'Input',
  'input.prompt': 'Prompt (opsional)',
  'input.remove': 'Hapus input ini',
  'input.add': '+ Tambah input',

  // ProcessNode (Output block)
  'process.print': 'Cetak',
  'process.customValue': '✎ Nilai',
  'process.valueOrLiteralInferred': 'teks atau 5',
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
};

export const translations = { en, id };
