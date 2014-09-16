(function() {
    var includeDir = Editor.nppDir + "\\plugins\\jN\\includes",
        modules = {},
        fso, savedRequire;

    if (typeof require !== 'undefined') {
        savedRequire = require;
    }

    require = function(path) {
        if (!fso) {
            fso = new ActiveXObject("Scripting.FileSystemObject");
        }
        var file_path = (includeDir + "/" + path.replace(/^\.[\/\\]/, "") + ".js").replace(/\//g, "\\");
        if (modules[file_path]) {
            return modules[file_path];
        }
        if (!fso.FileExists(file_path)) {
            if (savedRequire) {
                savedRequire(path);
            } else {
                alert("not found: " + file_path);
            }
        } else {
            var input_stream = fso.OpenTextFile(file_path, 1, false, 0);
            var module_code = input_stream.ReadAll();
            module_code = decodeFrom(65001, module_code);
            input_stream.Close();
            var savedIncludeDir = includeDir;
            includeDir = file_path.replace(/\\[^\\]*$/, "");
            var module = {
                exports: {}
            };
            var exports = modules[file_path] = module.exports;
            try {
                eval("(function(){" + module_code + ";})()");
            } catch (e) {
                alert("error loading '" + path + "': " + e.message);
            }
            includeDir = savedIncludeDir;
            return module.exports;
        }
    };

    if (savedRequire) {
        require.hash = savedRequire.hash;
    }
})();