import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { enqueueMessage } from "../model/slices/outboxSlice";
import { flushOutbox } from "../thunk/sendOutboxThunk";
import { clearIncoming } from "../model/slices/websocketSlice";

import type { AppDispatch, RootState } from "@/store/store.ts";

import { useChatMessages } from "./useChatMessages";
import { useUnreadChats } from "./useUnreadChats";
import { useContacts } from "./useContacts.ts";
import { toOutboxMessage } from "@/features/chat/model/mapper.ts";
import type {Contact} from "@/features/chat/model/types.ts";

export function useChat() {
    const dispatch = useDispatch<AppDispatch>();

    /* ======================
       UI state
    ====================== */
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    /* ======================
       Contacts
    ====================== */
    const { contacts, getContactById } = useContacts();

    const filteredChats = useMemo(
        () =>
            contacts.filter((c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [contacts, searchQuery]
    );

    /* ======================
        Chat selection
    ====================== */
    const selectedChat = useMemo(
        () => {
            console.debug("selectedChat", selectedChatId);
            return selectedChatId? getContactById(selectedChatId) : null;
        },
        [selectedChatId, getContactById]
    );

    /* ======================
       Refs (WS safe)
    ====================== */
    const selectedChatRef = useRef<Contact | null>(null);
    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    /* ======================
       User info
    ====================== */
    const myId = useSelector((state: RootState) => state.user.id);

    /* ======================
       Derived
    ====================== */
    const isChatOpen = selectedChat !== null;

    /* ======================
       Messages / unread
    ====================== */
    const { unreadChats, markUnread, markRead } = useUnreadChats();
    const {
        messagesMap,
        reloadChatHistory,
        handleIncomingMessage,
        clearChat,
    } = useChatMessages();

    /* ======================
       WebSocket incoming
    ====================== */
    const lastIncoming = useSelector(
        (state: RootState) => state.ws.lastIncoming
    );

    useEffect(() => {
        if (!lastIncoming) return;

        if (lastIncoming.type === "message") {
            handleIncomingMessage({
                msg: lastIncoming.payload,
                onUnread: (chatId: string) => {
                    if (chatId !== selectedChatRef.current?.id) {
                        markUnread(chatId);
                    }
                },
            });
        }

        dispatch(clearIncoming());
    }, [dispatch, handleIncomingMessage, lastIncoming, markUnread, myId]);

    /* ======================
       Reconnect handling
    ====================== */
    const wsStatus = useSelector((state: RootState) => state.ws.status);

    useEffect(() => {
        if (wsStatus !== "connected") return;
        if (selectedChatRef.current === null) return;

        console.debug("selectedChatId", selectedChatRef.current);
        reloadChatHistory(selectedChatRef.current).catch(console.error);
    }, [wsStatus, myId, reloadChatHistory]);

    /* ======================
       Actions
    ====================== */
    async function openChat(chatId: string) {
        setSelectedChatId(chatId);
        markRead(chatId);
        const contact = getContactById(chatId);
        if (!contact) return;
        await reloadChatHistory(contact);
    }

    function sendMessage(text: string) {
        if (!selectedChat || !text.trim()) return;
        setMessageInput("");

        dispatch(
            enqueueMessage(
                toOutboxMessage({
                    from: myId,
                    to: selectedChat.id,
                    text,
                })
            )
        );
        dispatch(flushOutbox());
    }

    async function deleteChat() {
        if (!selectedChat) return;

        await clearChat(selectedChat);
        setSelectedChatId(null);
    }

    return {
        contacts,
        filteredChats,
        selectedChat,
        selectedChatId,
        setSelectedChatId,
        messageInput,
        setMessageInput,
        searchQuery,
        setSearchQuery,
        openChat,
        sendMessage,
        deleteChat,
        unreadChats,
        messagesMap,
        isChatOpen,
    };
}
