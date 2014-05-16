/*jshint evil:true*/
/*global vb:true,escape,ActiveXObject*/
vb = (function(vbe) {
    var ret = {};

    vbe.Language = "VBScript";
    vbe.AllowUI = true;

    var constants = [
        "OK", "Cancel", "Abort", "Retry", "Ignore", "Yes", "No",
        "OKOnly", "OKCancel", "AbortRetryIgnore", "YesNoCancel", "YesNo", "RetryCancel",
        "Critical", "Question", "Exclamation", "Information",
        "DefaultButton1", "DefaultButton2", "DefaultButton3"
    ];
    for (var i = 0; constants[i]; i++) {
        ret["vb" + constants[i]] = vbe.eval("vb" + constants[i]);
    }

    ret.inputBox = function(prompt, title, msg, xpos, ypos) {
        var args = [
            toVBStringParam(prompt),
            toVBStringParam(title),
            toVBStringParam(msg),
        ];
        if (xpos != null) {
            args.push(xpos);
            if (ypos != null) {
                args.push(ypos);
            }
        }
        return vbe.eval('InputBox(' + args.join(",") + ')');
    };

    ret.msgBox = function(prompt, buttons, title) {
        return vbe.eval('MsgBox(' + [
            toVBStringParam(prompt),
            buttons != null ? buttons : "Empty",
            toVBStringParam(title)
        ].join(",") + ')');
    };

    function toVBStringParam(str) {
        return str != null ? 'Unescape("' + escape(str + "") + '")' : "Empty";
    }

    return ret;
})(new ActiveXObject("ScriptControl"));

// var name = vb.inputBox('I am "Script-101".\nWhat is your name?', "Name");
// var greetings = name ? 'Nice to meet you "' + name + '".' : "That's fine, you don't have to tell me who you are.";
// vb.msgBox(greetings, name ? vb.vbInformation : vb.vbCritical, "Greetings");
