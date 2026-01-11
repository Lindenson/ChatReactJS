import { useState, useCallback } from "react";
import { fetchChatHistory } from "../lib/chatApi.js";

/**
 * messagesMap:
 * Map<chatId, Array<{ fromMe: boolean, text: string }>>
 */
export function useChatMessages() {
  const [messagesMap, setMessagesMap] = useState(new Map());

  /* ===== Set full history ===== */
  const setChatHistory = useCallback((chatId, messages) => {
    setMessagesMap((prev) => {
      const next = new Map(prev);
      next.set(chatId, messages);
      return next;
    });
  }, []);

  /* ===== Reload history from backend ===== */
  const reloadChatHistory = useCallback(
    async ({ chatId, myId, contacts }) => {
      if (!contacts[chatId]) return;

      try {
        const rawHistory = await fetchChatHistory(myId, contacts[chatId].name);

        const normalized = rawHistory.map((msg) => ({
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

  /* ===== Handle incoming WS message ===== */
  const handleIncomingMessage = useCallback(
    ({ msg, myId, contacts, onUnread }) => {
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

  /* ===== Clear chat ===== */
  const clearChat = useCallback((chatId) => {
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
