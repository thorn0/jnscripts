(function() {
    if (typeof jsMenu === 'undefined') {
        jsMenu = Editor.addMenu('JavaScript');
    }
    var menu = jsMenu;

    var UglifyJS;

    function ensureUglifyJS2() {
        require('UglifyJS2/json2');
        UglifyJS = require('UglifyJS2/uglifyjs2');
    }

    menu.addItem({
        text: 'UglifyJS2',
        cmd: catchAndShowException(function() {
            var viewProp = Editor.currentView.selection ? 'selection' : 'text';
            var origCode = Editor.currentView[viewProp];
            var finalCode = uglify(origCode);
            Editor.currentView[viewProp] = finalCode;
        })
    });

    menu.addItem({
        text: 'Beautify with UglifyJS2',
        cmd: catchAndShowException(function() {
            var view = Editor.currentView,
                viewProp = view.selection ? 'selection' : 'text',
                origCode = view[viewProp],
                savedLine = view.line;
            var finalCode = uglify(origCode, {
                compress: false,
                mangle: false,
                output: {
                    beautify: true,
                    comments: true,
                    quote_style: 1
                }
            });
            view[viewProp] = normalizeEol(normalizeSpaces(finalCode));
            // adjust the scroll position
            view.line = savedLine + 7;
            view.line = savedLine;
        })
    });

    function uglify(code, options) {
        ensureUglifyJS2();
        options = options || {};
        options.fromString = true;
        return UglifyJS.minify(code, options).code;
    }
})();