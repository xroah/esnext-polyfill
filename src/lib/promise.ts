import {def, isPlainObject} from "../utils"

const PENDING = "pending"
const FULFILLED = "fulfilled"
const REJECTED = "rejected"

function resolve(value: any, _this: any) {
    /**
         * When fulfilled or rejected, a promise:
         * must not transition to any other state.
        */
    def(_this, "__status", FULFILLED)
    def(_this, "__result", value)
    setTimeout(function callFulfilledCallback() {
        _this.__fulfilledCallbacks.forEach((fulfilledCallback: Function) => {
            fulfilledCallback(value)
        })

        callFinallyCallbacks(_this)
    })
}

function resolvePromise(value: any, _this: any) {
    if (_this.__resolveOrRejectedCalled) {
        return
    }

    def(_this, "__resolveOrRejectedCalled", true)

    /**
     * If promise and value refer to the same object,
     * reject promise with a TypeError as the reason.
     * */
    if (value === _this) {
        return rejectPromise(
            new TypeError("The value can not be same as the promise instance"),
            _this
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
                resolve(value.__result, _this)
                break
            case REJECTED:
                rejectPromise(value.__result, _this)
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
        let then

        try {
            then = value.then
        } catch (err) {
            return rejectPromise(err, _this)
        }

        if (typeof then === "function") {
            try {
                then.call(value, resolvePromise, rejectPromise)
            } catch (err) {
                if (!_this.__resolveOrRejectedCalled) {
                    rejectPromise(err, _this)
                }
            }
        } else {
            resolve(value, _this)
        }
    } else {
        /**
         * If value is not an object or function, fulfill promise with value
         */
        resolve(value, _this)
    }
}

function rejectPromise(reason: any, _this: any) {
    if (_this.__resolveOrRejectedCalled) {
        return
    }

    /**
     * When fulfilled or rejected, a promise:
     * must not transition to any other state.
    */
    def(_this, "__result", reason)
    setTimeout(function callRejectedCallback() {
        if (_this.__rejectedCallbacks.length) {
            _this.__rejectedCallbacks.forEach((rejectedCallback: Function) => {
                rejectedCallback(reason)
            })
        } else if (!_this.__finallyCallbacks.length) {//in case console error multiple times
            console.error("Uncaught promise", reason)
        }

        callFinallyCallbacks(_this)
    })
}

function callFinallyCallbacks(_this: any) {
    _this.__finallyCallbacks.forEach((finallyCallback: Function) => {
        finallyCallback()
    })
}

class Promise {
    __fulfilledCallbacks: Function[] = []
    __rejectedCallbacks: Function[] = []
    __finallyCallbacks: Function[] = []
    __result: any
    __status = PENDING
    __resolveOrRejectedCalled = false

    constructor(executor: Function) {
        const _resolve = (value: any) => resolvePromise(value, this)
        const _reject = (value: any) => rejectPromise(value, this)

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
    then(onFulfilled?: Function, onRejected?: Function) {
        const _this = this

        return new Promise(function executor(resolve: Function, reject: Function) {
            const onFulfilledWrapper = (value: any) => {
                let val

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
            const onRejectedWrapper = (reason: any) => {
                let val

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

    catch(onRejected: Function) {
        return this.then(undefined, onRejected)
    }

    finally(finallyCallback: Function) {
        const _this = this

        return new Promise((resolve: Function, reject: Function) => {
            const finallyCallbackWrapper = () => {
                let val

                if (typeof finallyCallback === "function") {
                    try {
                        val = finallyCallback()
                    } catch (err) {
                        return reject(err)
                    }

                    return resolve(val)
                }

                if (_this.__status === FULFILLED) {
                    resolve(_this.__result)
                } else if (_this.__status === REJECTED) {
                    reject(_this.__result)
                }
            }

            _this.__finallyCallbacks.push(finallyCallbackWrapper)
        })
    }
}