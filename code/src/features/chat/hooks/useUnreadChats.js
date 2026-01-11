import { useState } from "react";

/**
 * Управляет непрочитанными чатами
 * unreadChats: Set<chatId>
 */
export function useUnreadChats() {
  const [unreadChats, setUnreadChats] = useState(new Set());

  function markUnread(chatId) {
    setUnreadChats((prev) => {
      if (prev.has(chatId)) return prev;
      const next = new Set(prev);
      next.add(chatId);
      return next;
    });
  }

  function markRead(chatId) {
    setUnreadChats((prev) => {
      if (!prev.has(chatId)) return prev;
      const next = new Set(prev);
      next.delete(chatId);
      return next;
    });
  }

  function clearAll() {
    setUnreadChats(new Set());
  }

  return {
    unreadChats,
    markUnread,
    markRead,
    clearAll,
  };
}
