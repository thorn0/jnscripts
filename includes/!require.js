(function() {
    var includeDir = Editor.nppDir + '\\plugins\\jN\\includes',
        modules = {},
        savedRequire = require,
        fso = new ActiveXObject('Scripting.FileSystemObject');

    require = function(path) {
        var filePath = (includeDir + '/' + path.replace(/^\.[\/\\]/, '') + '.js').replace(/\//g, '\\');
        if (!(filePath in modules)) {
            if (!fso.FileExists(filePath)) {
                if (savedRequire) {
                    savedRequire(path);
                } else {
                    alert('not found: ' + filePath);
                }
                modules[filePath] = null;
            } else {
                var moduleCode = readFile(filePath);
                var savedIncludeDir = includeDir;
                includeDir = filePath.replace(/\\[^\\]*$/, '');
                var module = {
                    exports: {}
                };
                modules[filePath] = module.exports;
                try {
                    /*jshint evil:true*/
                    var fn = new Function('exports', 'module', moduleCode);
                    fn(module.exports, module);
                } catch (e) {
                    alert('error loading \'' + path + '\': ' + e.message);
                }
                modules[filePath] = module.exports;
                includeDir = savedIncludeDir;
            }
        }
        return modules[filePath];
    };

    if (savedRequire) {
        for (var prop in savedRequire) {
            require[prop] = savedRequire[prop];
        }
    }

    function readFile(filePath) {
        var inputStream = fso.OpenTextFile(filePath, 1, false, 0);
        var content = decodeFrom(65001, inputStream.ReadAll());
        inputStream.Close();
        return content;
    }
})();