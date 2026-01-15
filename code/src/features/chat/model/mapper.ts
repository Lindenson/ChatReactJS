import {nanoid} from "@reduxjs/toolkit";
import type {ChatMessageView, DomainChatMessage, OutboxMessage} from "@/features/chat/model/types.ts";

type SendChatMessageCommand = {
    from: string;
    to: string;
    text: string;
};

export function toChatMessageView(
    msg: DomainChatMessage,
    myId: string
): ChatMessageView {
    return {
        id: msg.id,
        fromMe: msg.from === myId,
        text: msg.text,
        status: msg.status,
    };
}

export function toOutboxMessage(
    cmd: SendChatMessageCommand
): OutboxMessage {
    return {
        id: nanoid(),
        idempotencyKey: nanoid(),
        status: "pending",
        payload: {
            from: cmd.from,
            to: cmd.to,
            text: cmd.text,
        },
    };
}

