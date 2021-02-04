import PromisePolyfill, {REJECTED} from "../../src/polyfill/promise"

describe("Promise", () => {
    it("Should throw an error", done => {
        const error = new Error("error")
        const p = new PromisePolyfill(() => {
            throw error
        })
        p.catch((err: any) => {
            expect(err).toBe(error)
            expect(p.__result__).toBe(error)
            expect(p.__status__).toBe(REJECTED)

            done()
        })
    })
})