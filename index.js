const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function def(obj, prop, value) {
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

function isObject(object) {
    return Object.prototype.toString.call(object) === "[object Object]";
}

export default class P {
    constructor(executor) {
        const _resolve = value => {
            def(this, "status", FULFILLED);

            setTimeout(
                () => {
                    this.fulfilledCb.forEach(r => r(value));
                }
            );
        };
        const resolve = value => {
            /**
             * If both resolvePromise and rejectPromise are called, 
             * or multiple calls to the same argument are made, 
             * the first call takes precedence, and any further calls are ignored.
             */
            if (
                this.status === FULFILLED ||
                this.status === REJECTED
            ) return;

            if (value == undefined) { //Just fulfill the promise
                return _resolve(this);
            }

            /**
             * If promise and value refer to the same object,
             * reject promise with a TypeError as the reason.
             */
            if (value === this) {
                return reject(
                    new TypeError("The value can not be same as the promise instance")
                );
            }

            /**
             * If value is a promise, adopt its state 
             * If value is pending, promise must remain pending until value is fulfilled or rejected.
             * If/when value is fulfilled, fulfill promise with the same value.
             * If/when value is rejected, reject promise with the same reason.
             */
            if (value instanceof P) {
                if (value.status === FULFILLED) {
                    _resolve();
                } else if (value.status === REJECTED) {
                    _reject();
                } else {
                    value.then(resolve, reject);
                }
            } else if (isObject(value) || typeof value === "function") {
                /**
                 * If value is an object or function,
                 * Let then be value.then. 
                 * If retrieving the property value.then results in a thrown exception e,
                 *  reject promise with e as the reason.
                 * If then is a function, call it with value as this, 
                 * first argument resolvePromise, and second argument rejectPromise, where:
                 * If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
                 * If/when rejectPromise is called with a reason r, reject promise with r.
                 * If both resolvePromise and rejectPromise are called, 
                 * or multiple calls to the same argument are made, 
                 * the first call takes precedence, and any further calls are ignored.
                 * If calling then throws an exception e,
                 * If resolvePromise or rejectPromise have been called, ignore it.
                 * Otherwise, reject promise with e as the reason.
                 * If then is not a function, fulfill promise with value.
                 */
                let then;

                try {
                    then = value.then;
                } catch (error) {
                    return reject(error);
                }

                if (typeof then !== "function") {
                    _resolve(value);
                } else {
                    try {
                        then.call(value, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }
            } else {
                //Fulfill with the value
                _resolve(value);
            }
        };
        const reject = reason => {
            if (
                this.status === FULFILLED ||
                this.status === REJECTED
            ) return;

            def(this, "status", REJECTED);

            setTimeout(
                () => {
                    this.rejectedCb.forEach(r => r(reason));
                }
            );;
        };

        if (new.target !== P) {
            throw new Error("Constructor P requires 'new'");
        }

        this.fulfilledCb = [];
        this.rejectedCb = [];
        this.status = PENDING;

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    /**
     * then must return a promise
     * promise2 = promise1.then(onFulfilled, onRejected);
     * If either onFulfilled or onRejected returns a value x, 
     * run the Promise Resolution Procedure [[Resolve]](promise2, x).
     * If either onFulfilled or onRejected throws an exception e,
     *  promise2 must be rejected with e as the reason.
     * If onFulfilled is not a function and promise1 is fulfilled,
     *  promise2 must be fulfilled with the same value as promise1.
     * If onRejected is not a function and promise1 is rejected, 
     * promise2 must be rejected with the same reason as promise1.
     */
    then(onFulfilled, onRejected) {
        return new P((resolve, reject) => {
            const _onFulfilled = v => {
                if (typeof onFulfilled !== "function") {
                    return resolve(v);
                }

                try {
                    resolve(onFulfilled(v));
                } catch (error) {
                    reject(error);
                }
            };
            const _onRejected = r => {
                if (typeof onRejected !== "function") {
                    return reject(r);
                }

                try {
                    resolve(onRejected(r));
                } catch (error) {
                    reject(error);
                }
            };

            this.fulfilledCb.push(_onFulfilled);
            this.rejectedCb.push(_onRejected);
        });
    }
}