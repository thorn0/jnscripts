catchAndShowException = function(f) {
    return function() {
        try {
            f.apply();
        } catch (e) {
            if (!e.stack) {
                e.stack = '';
            }
            alert(e);
        }
    };
};