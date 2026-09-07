import "fake-indexeddb/auto";
import {describe, it, expect, beforeEach, vi} from "vitest";

// Shrink the media-cache budget so eviction is testable with tiny blobs.
vi.mock("@/shared/config/chat.ts", async (orig) => ({
    ...(await orig<typeof import("@/shared/config/chat.ts")>()),
    ATTACHMENT_CACHE_MAX_BYTES: 100,
}));

import {
    saveOutboxToDB, loadOutboxFromDB,
    saveHistoryToDB, loadHistoryFromDB,
    saveAttachmentBlob, loadAttachmentBlob, deleteAttachmentBlob,
    deleteChatCache, historyChatIds, pruneAttachmentIndex,
    clearAllLocalData,
} from "../db";
import type {OutboxState} from "@/features/chat/model/types";
import type {ChatMessage} from "@/features/chat/model/schema/domainChatMessage.schema";

const blob = (bytes: number) => new Blob([new Uint8Array(bytes)]);

describe("db (IndexedDB via fake-indexeddb)", () => {
    beforeEach(async () => { await clearAllLocalData(); });

    it("round-trips the outbox", async () => {
        const state = {messages: [{id: "m1"}]} as unknown as OutboxState;
        await saveOutboxToDB(state);
        expect(await loadOutboxFromDB()).toEqual(state);
    });

    it("round-trips per-conversation history and returns null for an unknown chat", async () => {
        const msgs = [{id: "a"}, {id: "b"}] as unknown as ChatMessage[];
        await saveHistoryToDB("c1", msgs);
        expect(await loadHistoryFromDB("c1")).toEqual(msgs);
        expect(await loadHistoryFromDB("nope")).toBeNull();
    });

    it("round-trips an attachment blob and deletes it", async () => {
        await saveAttachmentBlob("att1", blob(10));
        expect(await loadAttachmentBlob("att1")).not.toBeNull();
        await deleteAttachmentBlob("att1");
        expect(await loadAttachmentBlob("att1")).toBeNull();
    });

    it("evicts the OLDEST attachment once the byte budget is exceeded", async () => {
        await saveAttachmentBlob("a", blob(40));
        await saveAttachmentBlob("b", blob(40)); // total 80 ≤ 100
        await saveAttachmentBlob("c", blob(40)); // total 120 > 100 → oldest "a" evicted
        expect(await loadAttachmentBlob("a")).toBeNull();
        expect(await loadAttachmentBlob("b")).not.toBeNull();
        expect(await loadAttachmentBlob("c")).not.toBeNull();
    });

    it("re-saving an id refreshes it as newest (not evicted next)", async () => {
        await saveAttachmentBlob("a", blob(40));
        await saveAttachmentBlob("b", blob(40));
        await saveAttachmentBlob("a", blob(40)); // touch "a" → order now [b, a]
        await saveAttachmentBlob("c", blob(40)); // evicts oldest "b"
        expect(await loadAttachmentBlob("b")).toBeNull();
        expect(await loadAttachmentBlob("a")).not.toBeNull();
        expect(await loadAttachmentBlob("c")).not.toBeNull();
    });

    it("deleteChatCache drops the history AND its attachment blobs — and keeps the index consistent", async () => {
        const msgs = [
            {id: "m1", meta: {attachmentId: "att1"}},
            {id: "m2"},
            {id: "m3", meta: {attachmentId: "att2"}},
        ] as unknown as ChatMessage[];
        await saveHistoryToDB("c1", msgs);
        await saveAttachmentBlob("att1", blob(10));
        await saveAttachmentBlob("att2", blob(10));

        await deleteChatCache("c1");

        expect(await loadHistoryFromDB("c1")).toBeNull();
        expect(await loadAttachmentBlob("att1")).toBeNull();
        expect(await loadAttachmentBlob("att2")).toBeNull();
        // Regression: the index entries were actually removed (the old code deleted by the wrong key shape
        // and leaked them), so there is nothing dangling left to prune.
        expect(await pruneAttachmentIndex()).toBe(0);
    });

    it("historyChatIds lists every cached conversation", async () => {
        await saveHistoryToDB("c1", [{id: "a"}] as unknown as ChatMessage[]);
        await saveHistoryToDB("c2", [{id: "b"}] as unknown as ChatMessage[]);
        expect((await historyChatIds()).sort()).toEqual(["c1", "c2"]);
    });

    it("clearAllLocalData wipes outbox, history and media", async () => {
        await saveOutboxToDB({messages: []} as unknown as OutboxState);
        await saveHistoryToDB("c1", [{id: "a"}] as unknown as ChatMessage[]);
        await saveAttachmentBlob("att1", blob(10));
        await clearAllLocalData();
        expect(await loadOutboxFromDB()).toBeNull();
        expect(await loadHistoryFromDB("c1")).toBeNull();
        expect(await loadAttachmentBlob("att1")).toBeNull();
    });
});
