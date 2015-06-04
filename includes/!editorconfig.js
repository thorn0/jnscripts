require("lib/Scintilla.js");

function getEditorConfig() {
    var sci = new Scintilla(Editor.currentView.handle);
    var fullFileName = Editor.currentView.files[Editor.currentView.file];
    var isCmw = /^d:\\cmw\\/i.test(fullFileName);
    var useTabs = !!sci.Call("SCI_GETUSETABS");
    var eolMode = sci.Call("SCI_GETEOLMODE");
    var useCrLf = eolMode === 0;
    var eol = isCmw ? '\r\n' : '\n';
    var tab = isCmw ? "\t" : Array(sci.Call("SCI_GETTABWIDTH") + 1).join(" ");
    return {
        useTabs: useTabs,
        useCrLf: useCrLf,
        eol: eol,
        tab: tab
    };
}

function normalizeEol(string) {
    var editorConfig = getEditorConfig();
    var eol = editorConfig.eol;
    return string.replace(/\r\n|\n\r|\n|\r/g, eol);
}