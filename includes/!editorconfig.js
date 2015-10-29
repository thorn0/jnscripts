require("lib/Scintilla.js");

function getEditorConfig() {
    var sci = new Scintilla(Editor.currentView.handle);
    var fullFileName = Editor.currentView.files[Editor.currentView.file];
    var useTabs = !!sci.Call("SCI_GETUSETABS");
    var eolMode = sci.Call("SCI_GETEOLMODE");
    var useCrLf = eolMode === 0;
    var eol = useCrLf ? '\r\n' : '\n';
    var tab = useTabs ? "\t" : Array(sci.Call("SCI_GETTABWIDTH") + 1).join(" ");
    return {
        useTabs: useTabs,
        useCrLf: useCrLf,
        eol: eol,
        tab: tab
    };
}

function normalizeEol(string) {
    var editorConfig = getEditorConfig();
    return string.replace(/\r\n|\n\r|\n|\r/g, editorConfig.eol);
}

// Simple heuristics to detect (and preserve) Allman-style braces
function detectAllman() {
    var text = Editor.currentView.text.replace(/\/\*.*?\*\//g, ''),
        re = /\{(?!(\s*|\w+)\})/g, // Ignore empty object literals and JSDoc type annotations.
        match;
    do {
        match = re.exec(text);
        if (match) {
            // Ignore lines where '=' precedes the brace.
            // If JS had negative lookbehind, we could just use it instead.
            var eqIdx = text.lastIndexOf('=', match.index);
            var nlIdx = text.lastIndexOf('\n', match.index);
            if (eqIdx > nlIdx) {
                var eqFound = /^[ \t]*$/.test(text.slice(eqIdx + 1, match.index));
                if (eqFound) {
                    continue;
                }
            }
            var precedingNlIdx = text.lastIndexOf('\n', match.index);
            if (precedingNlIdx !== -1) {
                var followingNlIdx = text.indexOf('\n', match.index);
                if (followingNlIdx !== -1) {
                    var line = text.slice(precedingNlIdx + 1, followingNlIdx);
                    return /^\s*\{\s*$/.test(line);
                }
            }
            return false;
        }
    } while (match);
    return false;
}