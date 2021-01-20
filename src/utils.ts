export function isPlainObject(obj: any) {
    return Object.prototype.toString.call(obj) === "[object Object]"
}

export function def(obj: any, prop: string, value: any) {
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