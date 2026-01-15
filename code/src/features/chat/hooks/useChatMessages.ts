import {useCallback, useState} from "react";
import {deleteChatHistory, fetchChatHistory} from "@/features/chat/rest/chatApi.js";
import type {ChatMessagesMap, ChatMessageView, Contact, DomainChatMessage} from "@/features/chat/model/types.ts";
import {toChatMessageView} from "@/features/chat/model/mapper.ts";
import {useSelector} from "react-redux";
import type {RootState} from "@/store/store.ts";


interface HandleIncomingParams {
    msg: DomainChatMessage;
    onUnread?: (chatId: string) => void;
}

export function useChatMessages() {

    /* ======================
       Messages View Storage
    ====================== */
    const [messagesMap, setMessagesMap] = useState<ChatMessagesMap>(new Map());

    /* ======================
       User info
    ====================== */
    const myId = useSelector((state: RootState) => state.user.id);


    // ===== Set full history =====
    const setChatHistory = useCallback(
        (chatId: string, messages: ChatMessageView[]) => {
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
        async (chat: Contact) => {
            console.debug("reloadChatHistory", chat);
            try {
                const rawHistory = await fetchChatHistory(myId, chat.id);
                const normalized: ChatMessageView[] = rawHistory.map((msg: DomainChatMessage) =>
                    toChatMessageView(msg, myId)
                );

                setChatHistory(chat.id, normalized);
            } catch (e) {
                console.error("Reload chat history error", e);
            }
        },
        [myId, setChatHistory]
    );

    // ===== Handle incoming WS message =====
    const handleIncomingMessage = useCallback(
        ({msg, onUnread}: HandleIncomingParams) => {
            console.debug("handleIncomingMessage", msg);
            const chatId = msg.from === myId ? msg.to : msg.from;

            if (msg.from !== myId) {
                onUnread?.(chatId);
            }

            setMessagesMap((prev) => {
                const next = new Map(prev);
                const chatMessages = next.get(chatId) ?? [];
                next.set(chatId, [...chatMessages, toChatMessageView(msg, myId)]);
                return next;
            });
        },
        [myId]
    );

    // ===== Clear chat =====
    const clearChat = useCallback(async (chat: Contact) => {
        console.debug("clearChat", chat);
        await deleteChatHistory(myId, chat.id);
        setMessagesMap((prev) => {
            const next = new Map(prev);
            next.delete(chat.id);
            return next;
        });
    }, [myId]);

    return {
        messagesMap,
        reloadChatHistory,
        handleIncomingMessage,
        clearChat,
    };
}
