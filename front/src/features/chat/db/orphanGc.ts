import {historyChatIds, deleteChatCache, pruneAttachmentIndex} from "./db.ts";
import {plaintextChatIds, deletePlaintextForChat} from "@/features/e2ee";
import {logger} from "@/shared/logger/logger.ts";

// Startup orphan sweep. Locally-cached chat data (history rows, attachment blobs, sealed secret plaintext)
// is meant to be purged when a chat is deleted — but that immediate cleanup can be missed: the server
// delete-history call failed, the chat was deleted on ANOTHER device, or the data predates the cleanup
// wiring. The result is stale caches the info page still counts. So once per session, after the authoritative
// chat list has loaded, we reconcile every local cache against it and drop what no longer exists.
//
// SAFETY: `liveIds` MUST be the COMPLETE current set of conversation ids (direct + group + sticky) from a
// SUCCESSFUL list load. A partial/errored set would wrongly evict a live chat's cache — the caller must not
// invoke this while the list is loading or errored. An empty set from a genuinely successful load (user has
// no chats) correctly purges everything.

/** Purge cached history + attachment blobs + secret plaintext for conversations not in `liveIds`. */
export async function reconcileOrphanCaches(liveIds: Set<string>): Promise<{chats: number; plaintext: number; index: number}> {
    let chats = 0, plaintext = 0, index = 0;
    try {
        for (const id of await historyChatIds()) {
            if (!liveIds.has(id)) { await deleteChatCache(id); chats++; }   // drops its history rows + attachment blobs
        }
        for (const id of await plaintextChatIds()) {
            if (!liveIds.has(id)) { await deletePlaintextForChat(id); plaintext++; }
        }
        index = await pruneAttachmentIndex();   // repair byte-accounting drift from past deletes
        if (chats || plaintext || index) logger.debug("orphan cache sweep", {chats, plaintext, index});
    } catch (e) {
        logger.debug("orphan cache sweep skipped (best-effort)", e as Error);
    }
    return {chats, plaintext, index};
}
