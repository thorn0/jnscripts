var jshint_options = {
    sub: true,
    shadow: true,
    expr: true,
    strict: false,
    boss: true, // Allow assignments inside if/for/while/do
    maxerr: 200,
    supernew: true,
    evil: true
};

var jshint_strict_options = {
    expr: true,
    strict: false,
    boss: true,
    maxerr: 200,
    supernew: true
};

var jshint_undef_and_unused_options = {
    undef: true,
    unused: true,
    strict: false,
    boss: true,
    maxerr: 200,
    expr: true,
    supernew: true,
    browser: true,
    jquery: true
};

var nonstrict_filter = [
    "to compare with 'null'",
    "to compare with 'undefined'",
    "to compare with ''",
    "to compare with '0'",
    "Missing radix",
    "used out of scope",
    "Mixed spaces",
    "Unnecessary semicolon"
];

var undef_filter = [
    "confirm",
    "escape",
    "console",
    "require",
    "define",
    "angular",
    "moment"
];

var jsh_menu;
if (typeof jsMenu == "undefined") {
    jsh_menu = jsMenu = Editor.addMenu("JavaScript");
} else {
    jsh_menu = jsMenu;
}
jsh_menu.addItem({
    text: "JSHint",
    cmd: function() {
        jsHintHandler(jshint_options);
    }
});
jsh_menu.addItem({
    text: "JSHint, maniac mode",
    cmd: function() {
        jsHintHandler(jshint_strict_options);
    }
});
jsh_menu.addItem({
    text: "JSHint, undef and unused",
    cmd: function() {
        jsHintHandler(jshint_undef_and_unused_options);
    }
});

var JSHINT;

function jsHintHandler(options) {

    var scripts = [],
        info = [],
        item, i, j, k;

    if (Editor.currentView.selection) {
        item = {};
        if (Editor.currentView.pos > Editor.currentView.anchor) {
            var sp = Editor.currentView.pos;
            Editor.currentView.pos = Editor.currentView.anchor;
            item.line0 = Editor.currentView.line;
            Editor.currentView.pos = sp;
        } else {
            item.line0 = Editor.currentView.line;
        }
        item.text = Editor.currentView.selection;
        scripts.push(item);
    } else {
        var syntax = (Editor.langs[Editor.currentView.lang] || "").toLowerCase();
        if (syntax == "asp" || syntax == "html") {
            var lines = Editor.currentView.lines,
                inside, parts;
            var reScript = /<script(?![^>]+(?:runat\b|type=['"](?!text\/javascript)))(?:|\s[^>]*?)>(.*)/i,
                reEnd = /<\/script>(.*)/i;
            for (i = 0; i < lines.count; i++) {
                var line = lines.get(i).text;
                while (line) {
                    if (inside) {
                        parts = line.split(reEnd);
                        if (item.text === null) {
                            item.text = parts[0];
                        } else {
                            item.text += parts[0];
                        }
                        if (parts.length > 1) {
                            inside = false;
                        }
                    } else {
                        parts = line.split(reScript);
                        if (parts.length > 1) {
                            inside = true;
                            scripts.push(item = {
                                line0: i,
                                text: null
                            });
                        }
                    }
                    line = parts[1];
                }
            }
        } else {
            scripts.push({
                text: Editor.currentView.text,
                line0: 0
            });
        }
    }

    if (!JSHINT) {
        JSHINT = require("JSHint/jshint").JSHINT;
        if (!JSHINT) {
            alert("JSHint can't be loaded");
            return;
        }
    }

    for (k = 0; k < scripts.length; k++) {
        if (!JSHINT(scripts[k].text, options)) {
            outer: for (i = 0; i < JSHINT.errors.length; i++) {
                var error = JSHINT.errors[i];
                if (error) {
                    if (options != jshint_strict_options)
                        for (j = 0; j < nonstrict_filter.length; j++)
                            if (~error.reason.indexOf(nonstrict_filter[j]))
                                continue outer;
                    if (options == jshint_undef_and_unused_options)
                        for (j = 0; j < undef_filter.length; j++)
                            if (!error.reason.indexOf("'" + undef_filter[j] + "' is not defined"))
                                continue outer;
                    info.push("Line " + (error.line + scripts[k].line0) + ": " + error.reason + "\n" + (error.evidence || "").replace(/^\s+|\s+$/g, ""));
                }
            }
        }
    }

    if (info.length) {
        alert(info.join("\n\n"));
    } else {
        alert(scripts.length ? "OK!" : "JavaScript code not found");
    }

}