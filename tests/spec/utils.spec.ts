import {isPlainObject, def} from "../../src/utils"

describe("isPlainObject", () => {
    it("{} should be true", () => {
        expect(isPlainObject({})).toBeTrue()
    })

    it("1 should be false", () => {
        expect(isPlainObject(1)).toBeFalse()
    })

    it("function should be false", () => {
        expect(isPlainObject(() => {})).toBeFalse()
    })

    it("array should be false", () => {
        expect(isPlainObject([1, 2, 3])).toBeFalse()
    })

    it("null or undefined should be false", () => {
        expect(isPlainObject(null)).toBeFalse()
        expect(isPlainObject(undefined)).toBeFalse()
    })

    it ("boolean should be false", () => {
        expect(isPlainObject(false)).toBeFalse()
    })
})

describe("def", () => {
    const obj = {}

    it("descriptor", () => {
        def(obj, "a", 1)

        const d = Object.getOwnPropertyDescriptor(obj, "a")!

        expect(d.value).toBe(1)
        expect(d.writable).toBeFalse()
        expect(d.configurable).toBeFalse()
        expect(d.enumerable).toBeFalse()
    })
})