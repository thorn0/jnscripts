/*global Editor, require, jsMenu: true, alert, getEditorConfig, normalizeEol, addHotKey */
(function() {

    function getSettings() {
        var settings = {
            max_preserve_newlines: 2,
            jslint: true
        };
        var editorConfig = getEditorConfig();
        if (editorConfig.useTabs) {
            settings.indent_with_tabs = true;
        }
        return settings;
    }

    var js_beautify;

    function ensureJsBeautifier() {
        if (typeof js_beautify !== 'undefined') {
            return;
        }
        js_beautify = require('js-beautify/beautify').js_beautify;
    }

    var menu;
    if (typeof jsMenu === "undefined") {
        menu = jsMenu = Editor.addMenu("JavaScript");
    } else {
        menu = jsMenu;
    }

    var action = {
        text: "JS Beautifier\tCtrl+Q",
        cmd: catchAndShowException(function() {
            ensureJsBeautifier();
            var view = Editor.currentView,
                savedLine = view.line,
                viewProp = view.selection ? 'selection' : 'text',
                origCode = view[viewProp],
                finalCode = js_beautify(origCode, getSettings());
            view[viewProp] = normalizeEol(finalCode);
            view.line = savedLine + 7; // adjust the scroll position
            view.line = savedLine;
        }),
        ctrl: true,
        key: 'q'
    };
    menu.addItem(action);
    addHotKey(action);

    function catchAndShowException(f) {
        return function() {
            try {
                f.apply();
            } catch (e) {
                if (!e.stack) e.stack = '';
                alert(e);
            }
        };
    }
})();