(function() {

    function getSettings() {
        var settings = {
            preserve_newlines: true,
            max_preserve_newlines: 2,
            jslint: true,
            e4x: true,
            brace_style: 'collapse-preserve-inline'
        };
        var editorConfig = getEditorConfig();
        if (editorConfig.useTabs) {
            // for the JS beautifier
            settings.indent_with_tabs = true;
            // for the CSS beautifier
            settings.indent_size = 1;
            settings.indent_char = '\t';
        } else {
            settings.indent_size = editorConfig.tab.length;
        }
        settings.eol = editorConfig.eol;
        // settings.keep_array_indentation = true;
        if (detectAllman()) {
            settings.brace_style = 'none';
            settings.space_in_paren = true;
            settings.end_with_newline = true;
            settings.space_before_conditional = false;
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

    if (typeof jsMenu === 'undefined') {
        jsMenu = Editor.addMenu('JavaScript');
    }

    var menu = jsMenu;

    var action = {
        text: 'JS Beautifier\tCtrl+Q',
        cmd: function() {
            callBeautifier(getSettings());
        },
        ctrl: true,
        key: 'q'
    };

    menu.addItem(action);

    addHotKey(action);

    menu.addItem({
        text: 'JS Beautifier (2 spaces)',
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
                code = beautifier(normalizeEol(origCode), settings);
            if (css) {
                // fix broken LESS markup
                code = code.replace(/(\S:) (extend|hover|focus|active)\b/g, '$1$2');
            } else {
                code = code.replace(/\bnew\(/g, 'new (');
                // TypeScript
                /*code = code
                    .replace(/\b(export|declare)[\s\n\r]+(var|function)\b/g, '$1 $2')
                    .replace(/ \? (\)|,)/g, '?$1');*/
                code = code
                    .replace(/\b(declare)[\s\n\r]+(var|function)\b/g, '$1 $2')
                    .replace(/ \? (\)|,)/g, '?$1');
                // ES6 extended object literals like { a, b } should stay on one line
                /*code = code.replace(/\{([\w\s,]+?)\}(\s+from)?/g, function($0, $1, $2) {
                    var objLiteral;
                    if ($1.indexOf('\n') === -1) {
                        objLiteral = $0;
                    } else {
                        objLiteral = '{' + (' ' + $1 + ' ').replace(/\s+/g, ' ') + '}';
                    }
                    return objLiteral + ($2 ? ' from' : '');
                });*/
                // sweet.js (pre-1.0)
                code = code
                    .replace(/return#/g, 'return #')
                    .replace(/# \{/g, '#{');
            }
            view[viewProp] = normalizeEol(code);
            // adjust the scroll position
            view.line = savedLine + 7;
            view.line = savedLine;
        })();
    }
})();