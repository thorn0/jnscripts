/*jshint node:true*/
var ug = require('uglify-js'),
    path = require('path'),
    fs = require('fs');

var prefix = '(function(){\n';
var suffix = '\n}());';

var parts = ug.FILES.filter(function(file) {
    var bn = path.basename(file, '.js');
    return bn !== 'sourcemap' && bn !== 'mozilla-ast' && bn !== 'exports';
}).map(function(file) {
    return fs.readFileSync(file, 'utf8');
});

var keys = Object.keys(ug);
var tpl = 'if (typeof @ != "undefined") exports["@"] = @;\n';
for (var i = 0; i < keys.length; i++) {
    parts.push(tpl.replace(/@/g, keys[i]));
}

parts.unshift(prefix);
parts.push('var fs={readFileSync:function(){return""}},UglifyJS=exports;');
parts.push('exports.minify=' + ug.minify);
parts.push(suffix);

var result = ug.minify(parts.join(''), {
    fromString: true
}).code;

fs.writeFileSync('../includes/UglifyJS2/uglifyjs2.js', result);