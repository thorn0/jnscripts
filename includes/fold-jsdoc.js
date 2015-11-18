(function() {

    if (typeof jsMenu === "undefined") {
        jsMenu = Editor.addMenu("JavaScript");
    }

    var menu = jsMenu;

    var action = {
        text: "Fold JSDoc",
        cmd: function() {
            if (typeof Scintilla === 'undefined') {
                require('lib/Scintilla.js');
            }
            var view = Editor.currentView,
                lines = view.lines,
                savedLine = view.line,
                sci = new Scintilla(view.handle);
            for (var i = 0; i < lines.count; i++) {
                var line = lines.get(i).text;
                if (/^\s*\/\*(\*|\s*(global|jshint)\s)/.test(line)) {
                    sci.Call("SCI_TOGGLEFOLD", i, 0);
                }
            }
            view.line = savedLine;
        }
    };

    menu.addItem(action);

})();