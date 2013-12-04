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
jsh_menu.addItem({ text: "JSHint", cmd: function() { jsHintHandler(jshint_options); } });
jsh_menu.addItem({ text: "JSHint, maniac mode", cmd: function() { jsHintHandler(jshint_strict_options); } });
jsh_menu.addItem({ text: "JSHint, undef and unused", cmd: function() { jsHintHandler(jshint_undef_and_unused_options); } });

var JSHINT;

function jsHintHandler(options) {

	var scripts = [], info = [], item, i, j, k;

	if (Editor.currentView.selection) {
		item = { };
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
			var lines = Editor.currentView.lines, inside, parts;
			var reScript = /<script(?![^>]+(?:runat\b|type=['"](?!text\/javascript)))(?:|\s[^>]*?)>(.*)/i, reEnd = /<\/script>(.*)/i;
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

/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
var split;

// Avoid running twice; that would break the `nativeSplit` reference
split = split || function (undef) {

    var nativeSplit = String.prototype.split,
        compliantExecNpcg = /()??/.exec("")[1] === undef, // NPCG: nonparticipating capturing group
        self;

    self = function (str, separator, limit) {
        // If `separator` is not a regex, use `nativeSplit`
        if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
            return nativeSplit.call(str, separator, limit);
        }
        var output = [],
            flags = (separator.ignoreCase ? "i" : "") +
                    (separator.multiline  ? "m" : "") +
                    (separator.extended   ? "x" : "") + // Proposed for ES6
                    (separator.sticky     ? "y" : ""), // Firefox 3+
            lastLastIndex = 0,
            // Make `global` and avoid `lastIndex` issues by working with a copy
            separator = new RegExp(separator.source, flags + "g"),
            separator2, match, lastIndex, lastLength;
        str += ""; // Type-convert
        if (!compliantExecNpcg) {
            // Doesn't need flags gy, but they don't hurt
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        /* Values for `limit`, per the spec:
         * If undefined: 4294967295 // Math.pow(2, 32) - 1
         * If 0, Infinity, or NaN: 0
         * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
         * If negative number: 4294967296 - Math.floor(Math.abs(limit))
         * If other: Type-convert, then use the above rules
         */
        limit = limit === undef ?
            -1 >>> 0 : // Math.pow(2, 32) - 1
            limit >>> 0; // ToUint32(limit)
        while (match = separator.exec(str)) {
            // `separator.lastIndex` is not reliable cross-browser
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));
                // Fix browsers whose `exec` methods don't consistently return `undefined` for
                // nonparticipating capturing groups
                if (!compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, function () {
                        for (var i = 1; i < arguments.length - 2; i++) {
                            if (arguments[i] === undef) {
                                match[i] = undef;
                            }
                        }
                    });
                }
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = lastIndex;
                if (output.length >= limit) {
                    break;
                }
            }
            if (separator.lastIndex === match.index) {
                separator.lastIndex++; // Avoid an infinite loop
            }
        }
        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
    };

    // For convenience
    String.prototype.split = function (separator, limit) {
        return self(this, separator, limit);
    };

    return self;

}();
