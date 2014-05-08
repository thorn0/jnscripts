function getEditorConfig() {
    var fullFileName = Editor.currentView.files[Editor.currentView.file];
    // TBD: replace with a logic based on http://editorconfig.org
    var isCmw = /^d:\\cmw\\/i.test(fullFileName);
    var useTabs = isCmw;
    var useCrLf = isCmw;
    var eol = isCmw ? '\r\n' : '\n';
    var tab = isCmw ? "\t" : "    ";
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