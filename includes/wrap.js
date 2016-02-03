(function() {
    if (typeof jsMenu === 'undefined') {
        jsMenu = Editor.addMenu('JavaScript');
    }
    var menu = jsMenu;

    var COMMENT = ' * ';

    menu.addItem({
        text: 'Wrap',
        cmd: function() {
            var editorConfig = getEditorConfig();
            var input = vb.inputBox('', 'Line length', '80-105');
            if (!input) return;
            var m = input.match(/^(\d{2,3})(?:-(\d{2,3}))?$/);
            if (!m) return;
            var lowerLimit = +m[1],
                upperLimit = +m[2];
            if (!upperLimit || upperLimit < lowerLimit) {
                upperLimit = lowerLimit;
            }
            var limits = [];
            for (var num = lowerLimit; num <= upperLimit; num++) {
                limits.push(num);
            }

            var viewProp = Editor.currentView.selection ? 'selection' : 'text';
            var origCode = normalizeEol(Editor.currentView[viewProp], '\n');

            var isComment = origCode.slice(0, 3) === COMMENT;
            var commentFirstLinePrefix, commentOtherLinesPrefix, commentLength = 0;
            if (isComment) {
                commentLength = origCode.search(/[^ *]/);
                if (commentLength === -1) {
                    commentLength = 3;
                }
                commentFirstLinePrefix = origCode.slice(0, commentLength);
                commentOtherLinesPrefix = COMMENT;
                while (commentOtherLinesPrefix.length < commentLength) {
                    commentOtherLinesPrefix += ' ';
                }
                origCode = origCode.replace(new RegExp('(^|\n)[ *]{0,' + commentLength + '}', 'g'), '$1');
            }

            var words = origCode.replace(/`[\s\S]+?`|\{@[\s\S]+?\}/g, function($0) {
                return $0; //.replace(/\s/g, '\0');
            }).split(/\s+/).map(function(word) {
                return word.replace(/\0/g, ' ');
            });

            var results = [],
                i, j;

            for (j = 0; j < limits.length; j++) {
                var lines = [],
                    line = '',
                    commentPrefix = commentFirstLinePrefix,
                    lineCandidate;
                for (i = 0; i < words.length; i++) {
                    lineCandidate = line + (line ? ' ' : '') + words[i];
                    if (lineCandidate.length <= limits[j] - commentLength) {
                        line = lineCandidate;
                    } else {
                        lines.push((isComment ? commentPrefix : '') + line);
                        commentPrefix = commentOtherLinesPrefix;
                        line = words[i];
                    }
                }
                if (line) {
                    lines.push((isComment ? commentPrefix : '') + line);
                }
                results.push(lines);
            }

            var result;
            for (j = 0; j < results.length; j++) {
                if (!result || result.length > results[j].length) {
                    result = results[j];
                }
            }

            Editor.currentView[viewProp] = result.join(editorConfig.eol);
        }
    });
})();