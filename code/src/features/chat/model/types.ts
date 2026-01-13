
// ===========================
// WebSocket layer
// ===========================

type WSStatus = "disconnected" | "connecting" | "connected"

export type WebSocketState = {
    status: WSStatus;
    lastIncoming: IncomingWSMessage | null;
    lastOutgoing: OutgoingWSMessage | null;
    error: string | null;
};

export type IncomingWSMessage = {
    type: string;
    payload?: unknown;
};

export type OutgoingWSMessage = {
    type: string;
    payload?: unknown;
};


// ===========================
// Outbox (sending queue)
// ===========================

export type OutboxMessagePayload = {
    from: string;
    to: string;
    message: string;
}

type OutboxMSStatus = "pending" | "sending" | "sent" | "failed"

export type OutboxMessage = {
    id: string;
    idempotencyKey: string;
    payload: OutboxMessagePayload;
    status: OutboxMSStatus;
};

export type OutboxState = {
    messages: OutboxMessage[];
    outboxVersion: number;
    persistedVersion: number;
};


// ===========================
// Chat layer
// ===========================

export type ChatMessage = {
    fromMe: boolean;
    text: string;
};

export type MessagesMap = Map<number, ChatMessage[]>;

export type Contact = {
    name: string;
};

export type IncomingChatMessage = {
    from: string;
    to: string;
    text: string;
};
