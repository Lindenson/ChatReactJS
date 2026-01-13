import {createAsyncThunk} from "@reduxjs/toolkit";
import {type ChatMessagePayload, markFailed, markSending, markSent,} from "../model/outboxSlice";
import type {RootState} from "@/store/store";


async function sendToServer(msg: ChatMessagePayload, idempotencyKey: string) {
    await fetch("/api/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(msg),
    });
}

export const flushOutbox = createAsyncThunk<
    void, void, { state: RootState }>("outbox/flush", async (_, {getState, dispatch}) => {
    const {messages} = getState().outbox;

    for (const msg of messages) {
        if (msg.status !== "pending" && msg.status !== "failed") continue;

        dispatch(markSending(msg.id));

        try {
            await sendToServer(msg.payload, msg.idempotencyKey);
            dispatch(markSent(msg.id));
        } catch {
            dispatch(markFailed(msg.id));
            break;
        }
    }
});