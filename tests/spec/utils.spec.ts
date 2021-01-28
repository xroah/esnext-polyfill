import {isPlainObject} from "../../src/utils"

describe("isPlainObject", () => {
    it("{} should be true", () => {
        expect(isPlainObject({})).toBeTrue()
    })
})