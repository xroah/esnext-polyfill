import PromisePolyfill, {REJECTED} from "../../src/lib/promise"

describe("Promise", () => {
    it("Should throw an error", done => {
        const error = new Error("error")
        const p = new PromisePolyfill(() => {
            throw error
        })
        p.catch((err: any) => {
            expect(err === error).toBeTrue()
            expect(p.__result__ === error).toBeTrue()
            expect(p.__status__ === REJECTED).toBeTrue()

            done()
        })
    })
})