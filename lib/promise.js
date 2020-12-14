"use strict"

var {
    isPlainObject,
    def
} = require("./utils")

var PENDING = "pending"
var FULFILLED = "fulfilled"
var REJECTED = "rejected"

function resolve(value) {
    var _this = this
    /**
         * When fulfilled or rejected, a promise:
         * must not transition to any other state.
        */
    def(this, "__status", FULFILLED)
    def(this, "__result", value)
    setTimeout(function callFulfilledCallback() {
        _this.__fulfilledCallbacks.forEach(function callback(fulfilledCallback) {
            fulfilledCallback(value)
        })
    })
}

function resolvePromise(value) {
    if (this.__resolveOrRejectedCalled) {
        return
    }

    var _resolve = resolve.bind(this)

    def(this, "__resolveOrRejectedCalled", true)

    /**
     * If promise and value refer to the same object,
     * reject promise with a TypeError as the reason.
     * */
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
     * */
    if (value instanceof Promise) {
        switch (status) {
            case FULFILLED:
                _resolve(value.__result)
                break
            case REJECTED:
                rejectPromise(value.__result)
                break
            default:
                value.then(resolvePromise, rejectPromise)
        }
    } else if (isPlainObject(value) || typeof value === "function") {
        /**
         * Otherwise, if value is an object or function,
         * Let then be value.then. 
         * If retrieving the property value.then results in a thrown exception e, 
         * reject promise with e as the reason.
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
        var then

        try {
            then = value.then
        } catch (err) {
            return rejectPromise(err)
        }

        if (typeof then === "function") {
            try {
                then.call(value, resolvePromise, rejectPromise)
            } catch (err) {
                if (!this.__resolveOrRejectedCalled) {
                    rejectPromise(err)
                }
            }
        } else {
            _resolve(value)
        }
    } else {
        /**
         * If value is not an object or function, fulfill promise with value
         */
        _resolve(value)
    }
}

function rejectPromise(reason) {
    var _this = this

    if (this.__resolveOrRejectedCalled) {
        return
    }

    def(this, "__resolveOrRejectedCalled", true)

    /**
     * When fulfilled or rejected, a promise:
     * must not transition to any other state.
    */
    def(this, "__result", reason)
    setTimeout(function callRejectedCallback() {
        if (this.__rejectedCallbacks.length) {
            _this.__rejectedCallbacks.forEach(function callback(rejectedCallback) {
                rejectedCallback(reason)
            })
        } else {
            console.error("Uncaught promise", reason)
        }
    })
}

function Promise(executor) {
    var _resolve = resolvePromise.bind(this)
    var _reject = rejectPromise.bind(this)

    def(this, "__fulfilledCallbacks", [])
    def(this, "__rejectedCallbacks", [])
    def(this, "__finallyCallbacks", [])

    this.__status = PENDING
    this.__result = undefined
    this.__resolveOrRejectedCalled = false

    try {
        executor(_resolve, _reject)
    } catch (err) {
        if (!this.__resolveOrRejectedCalled) {
            _reject(err)
        }
    }
}

/**
 * A promise’s then method accepts two arguments:
 * promise.then(onFulfilled, onRejected)
 * Both onFulfilled and onRejected are optional arguments:
 * If onFulfilled is not a function, it must be ignored.
 * If onRejected is not a function, it must be ignored.
 * If onFulfilled is a function:
 * it must be called after promise is fulfilled, with promise’s value as its first argument.
 * it must not be called before promise is fulfilled.
 * it must not be called more than once.
 * If onRejected is a function,
 * it must be called after promise is rejected, with promise’s reason as its first argument.
 * it must not be called before promise is rejected.
 * it must not be called more than once.
 * onFulfilled or onRejected must not be called
 * until the execution context stack contains only platform code.
 * onFulfilled and onRejected must be called as functions (i.e. with no this value).
 * then may be called multiple times on the same promise.
 * If/when promise is fulfilled, all respective onFulfilled callbacks 
 * must execute in the order of their originating calls to then.
 * If/when promise is rejected, all respective onRejected callbacks
 * must execute in the order of their originating calls to then.
 * then must return a promise.
 * promise2 = promise1.then(onFulfilled, onRejected);
 * If either onFulfilled or onRejected returns a value x, 
 * run the Promise Resolution Procedure [[Resolve]](promise2, x).
 * If either onFulfilled or onRejected throws an exception e,
 * promise2 must be rejected with e as the reason.
 * If onFulfilled is not a function and promise1 is fulfilled, 
 * promise2 must be fulfilled with the same value as promise1.
 * If onRejected is not a function and promise1 is rejected, 
 * promise2 must be rejected with the same reason as promise1.
 */
Promise.prototype.then = function then(onFulfilled, onRejected) {
    var _this = this

    return new Promise(function executor(resolve, reject) {
        var onFulfilledWrapper = function onFulfilledWrapper(value) {
            var val

            if (typeof onFulfilled === "function") {
                try {
                    val = onFulfilled(value)
                } catch (err) {
                    return reject(err)
                }

                return resolve(val)
            }

            resolve(value)
        }
        var onRejectedWrapper = function onRejectWrapper(reason) {
            var val

            if (typeof onRejected === "function") {
                try {
                    val = onRejected(reason)
                } catch (err) {
                    return reject(err)
                }

                return resolve(val)
            }

            reject(reason)
        }

        _this.__fulfilledCallbacks.push(onFulfilledWrapper)
        _this.__rejectedCallbacks.push(onRejectedWrapper)
    })
}

Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected)
}

Promise.prototype.finally = function (finallyCallback) {
    var _this = this

    return new Promise(function executor(resolve, reject) {
        var finallyCallbackWrapper = function finallyCallbackWrapper() {
            if (typeof finallyCallback === "function") {
                try {
                    finallyCallback()
                } catch (err) {
                    return reject(err)
                }

                if (_this.__status === FULFILLED) {
                    resolve(_this.__result)
                } else if (_this.__status === REJECTED) {
                    reject(_this.__result)
                }

                return
            }

            resolve(_this.__result)
        }

        this.__finallyCallbacks.push(finallyCallbackWrapper)
    })
}

module.exports = Promise