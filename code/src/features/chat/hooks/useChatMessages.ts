import {useCallback, useState} from "react";
import {fetchChatHistory} from "@/features/chat/rest/chatApi.js";
import type {ChatMessage, Contact, IncomingChatMessage, MessagesMap} from "@/features/chat/model/types.ts";

interface ReloadChatParams {
    chatId: number;
    myId: string;
    contacts: Contact[];
}

interface HandleIncomingParams {
    msg: IncomingChatMessage;
    myId: string;
    contacts: Contact[];
    onUnread?: (chatId: number) => void;
}


export function useChatMessages() {
    const [messagesMap, setMessagesMap] = useState<MessagesMap>(new Map());

    // ===== Set full history =====
    const setChatHistory = useCallback(
        (chatId: number, messages: ChatMessage[]) => {
            setMessagesMap((prev) => {
                const next = new Map(prev);
                next.set(chatId, messages);
                return next;
            });
        },
        []
    );

    // ===== Reload history from backend =====
    const reloadChatHistory = useCallback(
        async ({chatId, myId, contacts}: ReloadChatParams) => {
            const contact = contacts[chatId];
            if (!contact) return;

            try {
                const rawHistory = await fetchChatHistory(myId, contact.name);

                const normalized: ChatMessage[] = rawHistory.map((msg: any) => ({
                    fromMe: msg.from === myId,
                    text: msg.text,
                }));

                setChatHistory(chatId, normalized);
            } catch (e) {
                console.error("Reload chat history error", e);
            }
        },
        [setChatHistory]
    );

    // ===== Handle incoming WS message =====
    const handleIncomingMessage = useCallback(
        ({msg, myId, contacts, onUnread}: HandleIncomingParams) => {
            const chatName = msg.from === myId ? msg.to : msg.from;
            const chatId = contacts.findIndex((c) => c.name === chatName);

            if (chatId === -1) {
                console.warn("Unknown chat:", chatName);
                return;
            }

            if (msg.from !== myId) {
                onUnread?.(chatId);
            }

            setMessagesMap((prev) => {
                const next = new Map(prev);
                const chatMessages = next.get(chatId) ?? [];

                next.set(chatId, [
                    ...chatMessages,
                    {
                        fromMe: msg.from === myId,
                        text: msg.text,
                    },
                ]);

                return next;
            });
        },
        []
    );

    // ===== Clear chat =====
    const clearChat = useCallback((chatId: number) => {
        setMessagesMap((prev) => {
            const next = new Map(prev);
            next.delete(chatId);
            return next;
        });
    }, []);

    return {
        messagesMap,
        setChatHistory,
        reloadChatHistory,
        handleIncomingMessage,
        clearChat,
    };
}
