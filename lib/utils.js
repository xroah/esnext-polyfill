exports.isPlainObject = function(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]"
}

exports.def = function def(obj, prop, value) {
    Object.defineProperty(
        obj,
        prop,
        {
            value,
            writable: false,
            configurable: false
        }
    );
}