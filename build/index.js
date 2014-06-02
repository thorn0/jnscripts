/*jshint node:true*/
var ug = require('uglify-js'),
    path = require('path'),
    streamee = require('streamee'),
    fs = require('fs'),
    stream = require('stream');

var dest = fs.createWriteStream('../includes/UglifyJS2/uglifyjs2.js');

var prefix = '(function(){\n';
var suffix = '\n}());';

var srcStreams = ug.FILES.filter(function(file) {
    var bn = path.basename(file, '.js');
    return bn != 'sourcemap' && bn != 'mozilla-ast';
}).map(function(file) {
    return fs.createReadStream(file);
});

var exportCode = [];
var keys = Object.keys(ug);
var tpl = 'if (typeof @ != "undefined") exports["@"] = @;\n';
for (var i = 0; i < keys.length; i++) {
    exportCode.push(tpl.replace(/@/g, keys[i]));
}

srcStreams.unshift(stringToStream(prefix));
srcStreams.push(stringToStream(exportCode.join("")));
srcStreams.push(stringToStream(suffix));

streamee.concatenate(srcStreams).pipe(dest, false);

function stringToStream(stringValue) {
    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(stringValue);
    s.push(null);
    return s;
}