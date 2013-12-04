var includeDir = Editor.nppDir + "\\plugins\\jN\\includes", modules = {}, fso;

require = function(path) {
	if (!fso) fso = new ActiveXObject("Scripting.FileSystemObject");
	var file_path = (includeDir + "/" + path.replace(/^\.[\/\\]/, "") + ".js").replace(/\//g, "\\");
	if (modules[file_path]) {
		return modules[file_path];
	}
	if (!fso.FileExists(file_path)) {
		alert("not found: " + file_path);
	} else {
		var input_stream = fso.OpenTextFile(file_path, 1, false, 0);
		var module_code = input_stream.ReadAll();
		module_code = decodeFrom(65001, module_code);
		input_stream.Close();
		var savedIncludeDir = includeDir;
		includeDir = file_path.replace(/\\[^\\]*$/, "");
		var exports = modules[file_path] = {};
		try {
			eval("(function(){" + module_code + ";})()");
		} catch (e) {
			alert("error loading '" + path + "': " + e.message);
		}
		includeDir = savedIncludeDir;
		return exports;
	}
};

if (!Array.prototype.reduce) {
	Array.prototype.reduce = function(f, v) {
		var len = this.length;
		if (!len && arguments.length == 1) {
			throw new Error("reduce: empty array, no initial value");
		}
		var i = 0;
		if (arguments.length < 2) {
			while (true) {
				if (i in this) {
					v = this[i++];
					break;
				}
				if (++i >= len) {
					throw new Error("reduce: no values, no initial value");
				}
			}
		}
		for (; i < len; i++) {
			if (i in this) {
				v = f(v, this[i], i, this);
			}
		}
		return v;
	};
}