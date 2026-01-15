
// ===========================
// WebSocket layer
// ===========================

import type {IncomingWebRTCMessage} from "@/features/call/model/types.ts";

type WSStatus = "disconnected" | "connecting" | "connected"

export type WebSocketState = {
    status: WSStatus;
    lastIncoming: IncomingWSMessage | null;
    lastOutgoing: OutgoingWSMessage | null;
    error: string | null;
};

export type IncomingWSMessage =
    | { type: "message"; payload: DomainChatMessage }
    | IncomingWebRTCMessage;


export type OutgoingWSMessage = {
    type: string;
    payload?: unknown;
};


// ===========================
// Outbox bd layer
// ===========================

export type OutboxMessagePayload = {
    from: string;
    to: string;
    text: string;
}

export type OutboxMessage = {
    id: string;
    idempotencyKey: string;
    payload: OutboxMessagePayload;
    status: ChatMessageStatus;
};

export type OutboxState = {
    messages: OutboxMessage[];
    outboxVersion: number;
    persistedVersion: number;
};


// ===========================
// Chat UI
// ===========================

export type ChatMessageView = {
    id: MessageId;
    fromMe: boolean;
    text: string;
    status: ChatMessageStatus;
};

export type ChatMessagesMap = Map<string, ChatMessageView[]>;

export type Contact = {
    id: string;
    name: string;
    last: string;
    online: boolean;
};

// ===========================
// Domain: Message
// ===========================

export type MessageId = string;
export type ChatId = string;

export type ChatMessageStatus =
    | "pending"
    | "sending"
    | "sent"
    | "failed";

export type DomainChatMessage = {
    id: MessageId;
    chatId: ChatId;

    from: string;
    to: string;

    text: string;

    createdAt: number;
    status: ChatMessageStatus;

    idempotencyKey: string;
};
