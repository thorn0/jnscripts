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
            var view = Editor.currentView;
            var view_prop = view.selection ? 'selection' : 'text';
            var currentLine = view.line;
            var orig_code = view[view_prop];
            var final_code = js_beautify(orig_code, getSettings());
            view[view_prop] = normalizeEol(final_code);
            view.line = currentLine;
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