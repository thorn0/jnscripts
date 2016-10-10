(function() {

    function getSettings() {
        // https://github.com/beautify-web/js-beautify
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

    var beautifiers, uglify1;

    function ensureBeautifiers() {
        if (typeof beautifiers === 'undefined') {
            beautifiers = {
                js: require('js-beautify/beautify').js_beautify,
                css: require('js-beautify/beautify-css').css_beautify,
                html: require('js-beautify/beautify-html').html_beautify
            };
        }
        if (typeof uglify1 === 'undefined') {
            uglify1 = require("UglifyJS/uglify-js");
        }
    }

    if (typeof jsMenu === 'undefined') {
        jsMenu = Editor.addMenu('JavaScript');
    }

    var menu = jsMenu;

    var action = {
        text: 'Beautifier\tCtrl+Q',
        cmd: function() {
            callBeautifier(getSettings());
        },
        ctrl: true,
        key: 'q'
    };

    menu.addItem(action);

    addHotKey(action);

    menu.addItem({
        text: 'Beautifier (2 spaces)',
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
                fname = view.files[view.file],
                lang = /\.(le|c)ss$/i.test(fname) ? 'css' : /\.html?$/i.test(fname) ? 'html' : 'js',
                beautifier = beautifiers[lang],
                savedLine = view.line,
                viewProp = view.selection ? 'selection' : 'text',
                origCode = view[viewProp],
                isJson = lang === 'js' && (/^\s*(\{[\s\S]+\}|\[[\s\S]+\];?)\s*$/.test(origCode) || /\.json$/i.test(fname)),
                code = origCode;
            if (isJson) {
                var uglifyOptions = {
                    beautify: true,
                    quote_keys: true
                };
                code = uglify1.uglify.gen_code(uglify1.parser.parse("(" + code + ")"), uglifyOptions).replace(/;\s*$/, "");
                settings.wrap_line_length = settings.wrap_line_length || 80;
            }
            code = beautifier(normalizeEol(code), settings);
            if (lang === 'css') {
                // fix broken LESS markup
                code = code.replace(/(\S:) (extend|hover|focus|active)\b/g, '$1$2');
            }
            if (lang === 'js') {
                code = code.replace(/\bnew\(/g, 'new (');
                // TypeScript
                /*code = code
                    .replace(/\b(export|declare)[\s\n\r]+(var|function)\b/g, '$1 $2')
                    .replace(/ \? (\)|,)/g, '?$1');*/
                code = code
                    .replace(/\b(declare)[\s\n\r]+(var|function)\b/g, '$1 $2')
                    .replace(/ \? (\)|,)/g, '?$1');
                // ES2015 extended object literals like { a, b } should stay on one line
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
                    .replace(/return #/g, 'return #')
                    .replace(/# \{/g, '#{');
            }
            view[viewProp] = normalizeEol(code);
            // adjust the scroll position
            view.line = savedLine + 7;
            view.line = savedLine;
        })();
    }
})();