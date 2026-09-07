import {describe, it, expect, vi, beforeEach} from "vitest";

// buildResponse orchestration (the NACK behavior): ids we still hold → recovered ciphers; ids we don't →
// `missing`, so the requester can mark them lost immediately instead of waiting out the retry budget. Heavy
// deps (provisioning, at-rest, the ratchet) are mocked — this asserts the split, not the crypto.
vi.mock("../../lib/provisioning.ts", () => ({ensureProvisioned: vi.fn(async () => ({store: {}, deviceId: "dev"}))}));
const loadPlaintext = vi.fn();
vi.mock("../../lib/atRest.ts", () => ({loadPlaintext: (...a: unknown[]) => loadPlaintext(...a), E2EE_PLAINTEXT_TTL_MS: 172_800_000}));
const encryptRecovery = vi.fn(async (_s: unknown, _u: string, _c: string, items: Array<{mid: string; text: string}>) =>
    items.map((it) => ({mid: it.mid, t: 3, b: "cipher:" + it.mid})));
vi.mock("../../lib/secretSession.ts", () => ({encryptRecovery: (...a: never[]) => encryptRecovery(...a)}));

import {buildResponse, RECOVER_RESP} from "../protocol.ts";

beforeEach(() => { loadPlaintext.mockReset(); encryptRecovery.mockClear(); });

describe("buildResponse — recover vs NACK", () => {
    it("splits held ids into items and unheld ids into missing", async () => {
        loadPlaintext.mockImplementation(async (id: string) => (id === "have1" || id === "have2" ? "text-" + id : null));
        const resp = await buildResponse("requester", "chatX", ["have1", "gone1", "have2", "gone2"]);

        expect(resp.type).toBe(RECOVER_RESP);
        expect(resp.to).toBe("requester");
        expect(resp.conversationId).toBe("chatX");
        expect(resp.items.map((i) => i.mid)).toEqual(["have1", "have2"]);
        expect(resp.missing).toEqual(["gone1", "gone2"]);
        // only the held ids were handed to the ratchet, bound to the requested chat
        expect(encryptRecovery).toHaveBeenCalledWith({}, "requester", "chatX", [
            {mid: "have1", text: "text-have1"}, {mid: "have2", text: "text-have2"},
        ]);
    });

    it("all-unheld → no ciphers, every id NACKed (ratchet not invoked)", async () => {
        loadPlaintext.mockResolvedValue(null);
        const resp = await buildResponse("requester", "chatX", ["a", "b"]);
        expect(resp.items).toEqual([]);
        expect(resp.missing).toEqual(["a", "b"]);
        expect(encryptRecovery).not.toHaveBeenCalled();
    });

    it("all-held → all recovered, nothing missing", async () => {
        loadPlaintext.mockResolvedValue("hi");
        const resp = await buildResponse("requester", "chatX", ["a", "b"]);
        expect(resp.items.map((i) => i.mid)).toEqual(["a", "b"]);
        expect(resp.missing).toEqual([]);
    });
});
