/*global Editor, require, jsMenu: true, Scintilla */
(function() {

    require("lib/Scintilla.js");

    var menu;
    if (typeof jsMenu === "undefined") {
        menu = jsMenu = Editor.addMenu("JavaScript");
    } else {
        menu = jsMenu;
    }

    var action = {
        text: "Fold JSDoc",
        cmd: function() {
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