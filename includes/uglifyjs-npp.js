/*global Editor, require, jsMenu: true, getEditorConfig, normalizeEol */
var ug, jsp, pro;

function ensureUg() {
    if (ug) return;
    ug = require("UglifyJS/uglify-js");
    jsp = ug.parser;
    pro = ug.uglify;
}

function doBeautify(options) {
    var editorConfig = getEditorConfig();
    var eol = editorConfig.eol;
    var tab = editorConfig.tab;

    ensureUg();

    options = options || {};
    options.beautify = true;

    var tabcnt = 0;

    /*var pos0;
    if (Editor.currentView.pos > Editor.currentView.anchor) {
        pos0 = Editor.currentView.anchor;
    } else {
        pos0 = Editor.currentView.pos;
    }
    var text = Editor.currentView.text, c;
    for (;;) {
        c = text.charAt(pos0);
        if (c == '\n' || c == '\r') {
            pos0++;
            break;
        }
        pos0--;
    }
    var tabcnt = 0, spacecnt = 0;
    for (;;) {
        c = text.charAt(pos0++);
        if (c == '\t') {
            tabcnt++;
            spacecnt = 0;
        } else if (c == ' ') {
            spacecnt++;
            if (spacecnt == 4) {
                tabcnt++;
                spacecnt = 0;
            }
        } else break;
    }
    alert(tabcnt++);*/

    var view_prop = Editor.currentView.selection ? 'selection' : 'text';
    var orig_code = Editor.currentView[view_prop].replace(/^\s+/g, '');
    var syntax = (Editor.langs[Editor.currentView.lang] || '').toLowerCase();
    var final_code;
    if (!Editor.currentView.selection && (syntax === "asp" || syntax === "html")) {
        final_code = orig_code.replace(/<script(|\s[^>]*?)>([\s\S]*?)<\/script>/gi, function($0, $1, $2) {
            if (!$2 || $1 && $1.indexOf("runat=") !== -1) return $0;
            return "<script" + $1 + ">" + eol + tab + normalizeSpaces(pro.gen_code(jsp.parse($2), options), 1).replace(/^\s+|\s+$/ig, "") + eol + "</script>";
        });
    } else {
        var isJson = /^\s*(\{[\s\S]+\}|\[[\s\S]+\];?)\s*$/.test(orig_code);
        if (isJson) {
            options.quote_keys = true;
            orig_code = "(" + orig_code + ")";
        }
        final_code = normalizeSpaces(pro.gen_code(jsp.parse(orig_code), options), tabcnt);
        if (isJson) {
            final_code = final_code.replace(/;\s*$/, "");
        }
    }
    final_code = normalizeEol(final_code);
    Editor.currentView[view_prop] = final_code;
}

var menu;
if (typeof jsMenu === "undefined") {
    menu = jsMenu = Editor.addMenu("JavaScript");
} else {
    menu = jsMenu;
}
menu.addItem({
    text: "Uglify",
    cmd: catchAndShowException(function() {
        ensureUg();
        var view_prop = Editor.currentView.selection ? 'selection' : 'text';
        var orig_code = Editor.currentView[view_prop];
        var ast = jsp.parse(orig_code);
        ast = pro.ast_lift_variables(ast);
        ast = pro.ast_mangle(ast);
        ast = pro.ast_squeeze(ast);
        var final_code = pro.gen_code(ast);
        Editor.currentView[view_prop] = final_code;
    })
});
menu.addItem({
    text: "Beautify",
    cmd: catchAndShowException(doBeautify)
});
menu.addItem({
    text: "Beautify (sort object keys)",
    cmd: catchAndShowException(function() {
        doBeautify({
            sort_keys: true
        });
    })
});
menu.addItem({
    text: "Make var names unique",
    cmd: catchAndShowException(function() {
        ensureUg();
        var orig_code = Editor.currentView.selection || Editor.currentView.text;
        var ast = jsp.parse(orig_code);
        ast = ast_unique_names(ast);
        var final_code = normalizeSpaces(pro.gen_code(ast, {
            beautify: true
        }));
        if (Editor.currentView.selection)
            Editor.currentView.selection = final_code;
        else
            Editor.currentView.text = final_code;
    })
});

function normalizeSpaces(s, extra) {
    var tab = getEditorConfig().tab;
    return s.replace(/^( {4})*/gm, function($0) {
        return (new Array($0.length / 4 + 1 + (extra || 0))).join(tab);
    });
}

function HOP(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function ast_unique_names(ast, options) {
    var w = pro.ast_walker(),
        walk = w.walk,
        scope, cname = {
            value: -1
        };
    var MAP = pro.MAP;
    options = options || {};

    function get_mangled(name, newMangle) {
        if (!options.toplevel && !scope.parent) return name; // don't mangle toplevel
        if (options.except && member(name, options.except))
            return name;
        return scope.get_mangled(name, newMangle);
    }

    function get_define(name) {
        if (options.defines) {
            // we always lookup a defined symbol for the current scope FIRST, so declared
            // vars trump a DEFINE symbol, but if no such var is found, then match a DEFINE value
            if (!scope.has(name)) {
                if (HOP(options.defines, name)) {
                    return options.defines[name];
                }
            }
            return null;
        }
    }

    function _lambda(name, args, body) {
        var is_defun = this[0] == "defun";
        if (is_defun && name) name = get_mangled(name);
        body = with_scope(body.scope, function() {
            if (!is_defun && name) name = get_mangled(name);
            args = MAP(args, function(name) {
                return get_mangled(name);
            });
            return MAP(body, walk);
        });
        return [this[0], name, args, body];
    }

    function with_scope(s, cont) {
        var _scope = scope;
        scope = s;
        scope.cname = cname;
        scope.name_generator = function(a) {
            return 'x' + a + 'x';
        };
        for (var i in s.names)
            if (HOP(s.names, i)) {
                get_mangled(i, true);
            }
        var ret = cont();
        ret.scope = s;
        scope = _scope;
        return ret;
    }

    function _vardefs(defs) {
        return [this[0], MAP(defs, function(d) {
            return [get_mangled(d[0]), walk(d[1])];
        })];
    }

    return w.with_walkers({
        "function": _lambda,
        "defun": _lambda,
        "var": _vardefs,
        "const": _vardefs,
        "name": function(name) {
            return get_define(name) || [this[0], get_mangled(name)];
        },
        "try": function(t, c, f) {
            return [this[0],
                MAP(t, walk),
                c != null ? [get_mangled(c[0]), MAP(c[1], walk)] : null,
                f != null ? MAP(f, walk) : null
            ];
        },
        "toplevel": function(body) {
            var self = this;
            return with_scope(self.scope, function() {
                return [self[0], MAP(body, walk)];
            });
        }
    }, function() {
        return walk(pro.ast_add_scope(ast));
    });
}

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