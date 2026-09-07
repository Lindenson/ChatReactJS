import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach, vi} from "vitest";

// Mock the e2ee surface so this test stays in the chat-db realm (no libsignal). The plaintext side is
// asserted by the calls the sweep makes; the history/blob side runs against the real IndexedDB.
vi.mock("@/features/e2ee", () => ({
    plaintextChatIds: vi.fn(async () => ["c-live", "c-orphan", "c-secret-only"]),
    deletePlaintextForChat: vi.fn(async () => {}),
}));

import {reconcileOrphanCaches} from "../orphanGc";
import {plaintextChatIds, deletePlaintextForChat} from "@/features/e2ee";
import {
    saveHistoryToDB, loadHistoryFromDB,
    saveAttachmentBlob, loadAttachmentBlob, clearAllLocalData,
} from "../db";
import type {ChatMessage} from "@/features/chat/model/schema/domainChatMessage.schema";

const blob = (n: number) => new Blob([new Uint8Array(n)]);

describe("reconcileOrphanCaches", () => {
    beforeEach(async () => {
        await clearAllLocalData();
        vi.mocked(plaintextChatIds).mockClear();
        vi.mocked(deletePlaintextForChat).mockClear();
    });

    it("purges cached history + blobs + plaintext for chats not in the live set, keeps the rest", async () => {
        await saveHistoryToDB("c-live", [{id: "a"}] as unknown as ChatMessage[]);
        await saveHistoryToDB("c-orphan", [{id: "b", meta: {attachmentId: "att-orphan"}}] as unknown as ChatMessage[]);
        await saveAttachmentBlob("att-orphan", blob(20));

        const res = await reconcileOrphanCaches(new Set(["c-live"]));

        // History: the orphan is gone, the live one stays.
        expect(await loadHistoryFromDB("c-orphan")).toBeNull();
        expect(await loadHistoryFromDB("c-live")).not.toBeNull();
        // Its attachment blob is gone too.
        expect(await loadAttachmentBlob("att-orphan")).toBeNull();
        // Plaintext: cleared for the two orphan chats, never for the live one.
        expect(deletePlaintextForChat).toHaveBeenCalledWith("c-orphan");
        expect(deletePlaintextForChat).toHaveBeenCalledWith("c-secret-only");
        expect(deletePlaintextForChat).not.toHaveBeenCalledWith("c-live");
        expect(res).toMatchObject({chats: 1, plaintext: 2});
    });

    it("an empty live set (successful load, no chats) purges everything", async () => {
        await saveHistoryToDB("c1", [{id: "a"}] as unknown as ChatMessage[]);
        await saveHistoryToDB("c2", [{id: "b"}] as unknown as ChatMessage[]);
        const res = await reconcileOrphanCaches(new Set());
        expect(await loadHistoryFromDB("c1")).toBeNull();
        expect(await loadHistoryFromDB("c2")).toBeNull();
        expect(res.chats).toBe(2);
    });

    it("keeps everything when all chats are live (no-op)", async () => {
        await saveHistoryToDB("c-live", [{id: "a"}] as unknown as ChatMessage[]);
        const res = await reconcileOrphanCaches(new Set(["c-live", "c-orphan", "c-secret-only"]));
        expect(await loadHistoryFromDB("c-live")).not.toBeNull();
        expect(deletePlaintextForChat).not.toHaveBeenCalled();
        expect(res).toMatchObject({chats: 0, plaintext: 0});
    });
});
