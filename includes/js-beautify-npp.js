/*global Editor, require, jsMenu: true, alert, getEditorConfig, normalizeEol, addHotKey */
(function() {

    function getSettings() {
        var settings = {
            preserve_newlines: true,
            max_preserve_newlines: 2,
            jslint: true
        };
        var editorConfig = getEditorConfig();
        if (editorConfig.useTabs) {
            // for the JS beautifier
            settings.indent_with_tabs = true;
            // for the CSS beautifier
            settings.indent_size = 1;
            settings.indent_char = '\t';
        }
        return settings;
    }

    var js_beautify, css_beautify;

    function ensureBeautifiers() {
        if (typeof js_beautify === 'undefined') {
            js_beautify = require('js-beautify/beautify').js_beautify;
        }
        if (typeof css_beautify === 'undefined') {
            css_beautify = require('js-beautify/beautify-css').css_beautify;
        }
    }

    var menu;
    if (typeof jsMenu === "undefined") {
        menu = jsMenu = Editor.addMenu("JavaScript");
    } else {
        menu = jsMenu;
    }

    var action = {
        text: "JS Beautifier\tCtrl+Q",
        cmd: function() {
            callBeautifier(getSettings());
        },
        ctrl: true,
        key: 'q'
    };
    menu.addItem(action);
    addHotKey(action);

    menu.addItem({
        text: "JS Beautifier (2 spaces)",
        cmd: function() {
            var settings = getSettings();
            settings.indent_with_tabs = false;
            settings.indent_size = 2;
            callBeautifier(settings);
        }
    });

    function callBeautifier(settings) {
        catchAndShowException(function() {
            ensureBeautifiers();
            var view = Editor.currentView,
                css = /\.(less|css)$/i.test(view.files[view.file]),
                beautifier = css ? css_beautify : js_beautify,
                savedLine = view.line,
                viewProp = view.selection ? 'selection' : 'text',
                origCode = view[viewProp],
                finalCode = beautifier(normalizeEol(origCode), settings);
            if (css) {
                // fix broken LESS markup
                finalCode = finalCode.replace(/(\S:) (extend|hover|focus|active)\b/g, '$1$2');
            } else {
                finalCode = finalCode.replace(/\b(export|declare)[\s\n\r]+(var|function)\b/g, '$1 $2'); // TypeScript
            }
            view[viewProp] = normalizeEol(finalCode);
            view.line = savedLine + 7; // adjust the scroll position
            view.line = savedLine;
        })();
    }

    function catchAndShowException(f) {
        return function() {
            try {
                f.apply();
            } catch (e) {
                if (!e.stack) {
                    e.stack = '';
                }
                alert(e);
            }
        };
    }
})();