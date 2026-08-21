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
  'nav.help': 'Help',
  'nav.variableModeBeginner': 'Beginner Mode',
  'nav.variableModeBeginnerHint': "Declare a variable with just a value — its type is inferred automatically",
  'nav.variableModeStandard': 'Standard Mode',
  'nav.variableModeStandardHint': 'Declare a variable by choosing its data type explicitly',
  'nav.language': 'Language',
  'nav.confirmNew': 'Clear the canvas and start a new flowchart? This cannot be undone.',
  'nav.confirmOpen': 'Clear the canvas and open a different flowchart? This cannot be undone.',

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
  'help.blockTypes.heading': 'Block types',
  'help.block.startEnd.name': 'Start / End',
  'help.block.startEnd.desc': 'The two terminal blocks every flowchart needs — one of each, at most.',
  'help.block.variable.name': 'Variable',
  'help.block.variable.desc':
    'Declares a variable. In Beginner mode, just type a value and its type is inferred automatically; in Standard mode, pick the type yourself.',
  'help.block.assign.name': 'Assign',
  'help.block.assign.desc': 'Changes a variable already in scope, with =, +=, -=, *=, or /=.',
  'help.block.input.name': 'Input',
  'help.block.input.desc': 'Reads a value from the user into a variable, with an optional prompt.',
  'help.block.output.name': 'Output',
  'help.block.output.desc': "Prints a variable's value to the Output panel.",
  'help.block.if.name': 'If',
  'help.block.if.desc': 'Branches on a condition, into independently-wireable True/False paths.',
  'help.block.for.name': 'For',
  'help.block.for.desc': 'A counting loop — init, condition, and update, wired back on itself to close the loop.',
  'help.block.while.name': 'While',
  'help.block.while.desc': 'A condition-only loop, wired back on itself the same way as For.',
  'help.running.heading': 'Running your program',
  'help.running.body':
    'Run, Step, and Stop live above the Output panel. Run executes the whole program at once — the Output panel shows what it prints. Step runs it one line at a time instead, highlighting the block currently executing and updating a live Variable Watcher table after every step. Both need a connected End block first.',
  'help.codePanel.heading': 'Code panel',
  'help.codePanel.body':
    "The Java tab is a real editor, kept in sync with the flowchart in both directions — edit either one and the other updates. The Pseudocode tab shows the same program in plain structured English, for reading — it's generated from the flowchart, not editable itself.",
  'help.variableModes.heading': 'Variable modes',
  'help.variableModes.body':
    'Switch modes from the Project menu. Standard Mode (the default) is the traditional way: you pick the type yourself, and a value is optional. Beginner Mode infers a variable\'s type from the value you give it — no type names to learn yet. A value isn\'t required there either; leave it blank and pick Whole number / Text / Decimal number instead.',
  'help.menus.heading': 'Menus',
  'help.menus.body':
    'Project — New, Open/Save Project, Export Java (a compilable Main.java), and the variable-mode switch above. Canvas — Arrange (tidy the layout into columns) and Download PNG.',
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
  'declare.inferredTitle': 'Type inferred from the value',
  'declare.invalidName': "'{name}' is not a valid Java variable name",
  'declare.remove': 'Remove this variable',
  'declare.add': '+ Add variable',

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
  'nav.help': 'Bantuan',
  'nav.variableModeBeginner': 'Mode Pemula',
  'nav.variableModeBeginnerHint': 'Deklarasikan variabel hanya dengan nilai — tipenya disimpulkan secara otomatis',
  'nav.variableModeStandard': 'Mode Standar',
  'nav.variableModeStandardHint': 'Deklarasikan variabel dengan memilih tipe datanya secara eksplisit',
  'nav.language': 'Bahasa',
  'nav.confirmNew': 'Bersihkan kanvas dan mulai flowchart baru? Tindakan ini tidak bisa dibatalkan.',
  'nav.confirmOpen': 'Bersihkan kanvas dan buka flowchart lain? Tindakan ini tidak bisa dibatalkan.',

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
  'help.blockTypes.heading': 'Jenis blok',
  'help.block.startEnd.name': 'Start / End',
  'help.block.startEnd.desc': 'Dua blok terminal yang dibutuhkan setiap flowchart — masing-masing paling banyak satu.',
  'help.block.variable.name': 'Variabel',
  'help.block.variable.desc':
    'Mendeklarasikan sebuah variabel. Di Mode Pemula, cukup ketik nilai dan tipenya disimpulkan otomatis; di Mode Standar, pilih tipenya sendiri.',
  'help.block.assign.name': 'Ubah Nilai',
  'help.block.assign.desc': 'Mengubah nilai variabel yang sudah ada, dengan =, +=, -=, *=, atau /=.',
  'help.block.input.name': 'Input',
  'help.block.input.desc': 'Membaca nilai dari pengguna ke dalam variabel, dengan prompt opsional.',
  'help.block.output.name': 'Output',
  'help.block.output.desc': 'Mencetak nilai sebuah variabel ke panel Output.',
  'help.block.if.name': 'If',
  'help.block.if.desc': 'Bercabang berdasarkan sebuah kondisi, ke jalur True/False yang bisa dihubungkan secara independen.',
  'help.block.for.name': 'For',
  'help.block.for.desc':
    'Perulangan dengan penghitung — init, kondisi, dan update, dihubungkan kembali ke dirinya sendiri untuk menutup perulangan.',
  'help.block.while.name': 'While',
  'help.block.while.desc': 'Perulangan hanya dengan kondisi, dihubungkan kembali ke dirinya sendiri seperti For.',
  'help.running.heading': 'Menjalankan program',
  'help.running.body':
    'Run, Step, dan Stop berada di atas panel Output. Run menjalankan seluruh program sekaligus — panel Output menampilkan hasil cetaknya. Step menjalankannya satu baris setiap saat, menyorot blok yang sedang dijalankan dan memperbarui tabel Variable Watcher setelah setiap langkah. Keduanya butuh blok End yang sudah terhubung terlebih dahulu.',
  'help.codePanel.heading': 'Panel kode',
  'help.codePanel.body':
    'Tab Java adalah editor sungguhan, selalu selaras dengan flowchart di kedua arah — ubah salah satunya dan yang lain ikut diperbarui. Tab Pseudocode menampilkan program yang sama dalam bahasa Inggris terstruktur biasa, hanya untuk dibaca — dihasilkan dari flowchart, tidak bisa diedit langsung.',
  'help.variableModes.heading': 'Mode variabel',
  'help.variableModes.body':
    'Ganti mode dari menu Project. Mode Standar (default) adalah cara tradisional: Anda memilih tipenya sendiri, dan nilai bersifat opsional. Mode Pemula menyimpulkan tipe variabel dari nilai yang Anda berikan — belum perlu belajar nama-nama tipe. Nilai juga tidak wajib di sana; biarkan kosong dan pilih Bilangan bulat / Teks / Bilangan pecahan sebagai gantinya.',
  'help.menus.heading': 'Menu',
  'help.menus.body':
    'Project — New, Open/Save Project, Export Java (Main.java yang siap dikompilasi), dan pengaturan mode variabel di atas. Canvas — Arrange (merapikan tata letak menjadi kolom-kolom) dan Download PNG.',
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
  'declare.inferredTitle': 'Tipe disimpulkan dari nilai',
  'declare.invalidName': "'{name}' bukan nama variabel Java yang valid",
  'declare.remove': 'Hapus variabel ini',
  'declare.add': '+ Tambah variabel',

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
