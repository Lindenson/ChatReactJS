import {ensureProvisioned} from "../lib/provisioning.ts";
import {encryptRecovery, decryptRecovery, type RecoverCipher} from "../lib/secretSession.ts";
import {loadPlaintext, E2EE_PLAINTEXT_TTL_MS} from "../lib/atRest.ts";
import {logger} from "@/shared/logger/logger.ts";

// The recovery protocol messages (ride the opaque SIGNAL channel, so `from`/`to`/`conversationId` are added
// by the transport). clientIds are NOT secret; only the recovered message bodies are (re-encrypted). The
// re-encryption runs on a DEDICATED, orthogonal session (see secretSession.encryptRecovery) so it repairs
// a genuinely STALLED ratchet — a repair sent on the normal chain would land past the same gap.
export const RECOVER_REQ = "e2ee:recover-req";
export const RECOVER_RESP = "e2ee:recover-resp";

export const MAX_RECOVER_BATCH = 50;          // cap ids per request (anti-storm / anti-oracle)

export interface RecoverReq { type: typeof RECOVER_REQ; to: string; conversationId: string; clientIds: string[] }
// `items` = messages the responder could re-encrypt; `missing` = ids it CANNOT provide (expired past the
// 48h window, or it never held them). The NACK matters: without it the requester can't tell "the sender is
// still thinking / offline" from "the sender genuinely can't help", so it would wait out the whole retry
// budget (~6 min) before giving up. With it, an unrecoverable message is marked lost as soon as the sender
// answers — a definitive outcome, not silent limbo.
export interface RecoverResp { type: typeof RECOVER_RESP; to: string; conversationId: string; items: RecoverCipher[]; missing: string[] }

/** Build the outgoing request frame (batched, capped). */
export function buildRequest(peerId: string, chatId: string, clientIds: string[]): RecoverReq {
    return { type: RECOVER_REQ, to: peerId, conversationId: chatId, clientIds: clientIds.slice(0, MAX_RECOVER_BATCH) };
}

/**
 * Responder (the ORIGINAL sender): for each requested id, look up OUR own stored plaintext (kept under the
 * client id at send) and re-encrypt it on a FRESH recovery session to the requester — a clean chain, no
 * gap, and each item AEAD-bound to (messageId, chatId). We only ever return what we ourselves sent and
 * still hold (≤ 48h), which authorizes the request by construction. Batch is capped (anti-oracle).
 */
export async function buildResponse(requesterId: string, chatId: string, clientIds: string[]): Promise<RecoverResp> {
    const {store} = await ensureProvisioned();
    const have: Array<{mid: string; text: string}> = [];
    const missing: string[] = [];
    for (const clientId of clientIds.slice(0, MAX_RECOVER_BATCH)) {
        const plain = await loadPlaintext(clientId, E2EE_PLAINTEXT_TTL_MS);
        if (plain != null) have.push({ mid: clientId, text: plain });
        else missing.push(clientId);                                    // expired past 48h, or we never held it → NACK
    }
    const ciphers = have.length ? await encryptRecovery(store, requesterId, chatId, have) : [];
    logger.info("e2ee recovery: responding", {requesterId, chatId, recover: ciphers.length, missing: missing.length});
    return { type: RECOVER_RESP, to: requesterId, conversationId: chatId, items: ciphers, missing };
}

/** Requester side: decrypt each recovered item on the recovery session, verifying its binding to chatId. */
export async function applyResponse(senderId: string, chatId: string, items: RecoverCipher[]): Promise<Array<{forClientId: string; plaintext: string}>> {
    const {store} = await ensureProvisioned();
    const recovered = await decryptRecovery(store, senderId, chatId, items);
    return recovered.map((r) => ({ forClientId: r.mid, plaintext: r.text }));
}
