/*global Editor, require, jsMenu: true*/
if (typeof jsMenu === "undefined") {
    jsMenu = Editor.addMenu("JavaScript");
}
var menu = jsMenu;

var UglifyJS;

function ensureUglifyJS2() {
    require('UglifyJS2/json2');
    UglifyJS = require('UglifyJS2/uglifyjs2');
}

menu.addItem({
    text: "UglifyJS2",
    cmd: catchAndShowException(function() {
        ensureUglifyJS2();
        var viewProp = Editor.currentView.selection ? 'selection' : 'text';
        var origCode = Editor.currentView[viewProp];
        var finalCode = UglifyJS.minify(origCode, {
            fromString: true
        }).code;
        Editor.currentView[viewProp] = finalCode;
    })
});

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