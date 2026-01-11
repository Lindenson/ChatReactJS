export default function ChatList({
  chats,
  unreadChats,
  search,
  setSearch,
  selectedChat,
  setSelectedChat,
  isChatOpen,
  myName,
  onLogout,
}) {
  return (
    <aside
      className={`bg-gray-200 border-r w-full sm:w-1/3 max-w-sm
      ${isChatOpen ? "hidden sm:block" : "block"}`}
    >
      {/* Header */}
      <div className="bg-teal-950 border-b">
        <div className="px-4 py-3 flex items-center justify-between text-white">
          <div className="font-semibold text-lg truncate">{myName}</div>

          <button
            onClick={onLogout}
            className="text-sm opacity-80 hover:opacity-100"
            title="Logout"
          >
            Salir
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Buscar contacto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full px-4 py-2 text-base bg-white border focus:outline-none"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="overflow-y-auto">
        {chats.map((chat, i) => {
          const isUnread = unreadChats?.has(i);

          return (
            <div
              key={i}
              onClick={() => setSelectedChat(i)}
              className={`p-4 cursor-pointer hover:bg-gray-100
                ${selectedChat === i ? "bg-gray-100" : ""}`}
            >
              {/* Name + unread dot */}
              <div className="flex items-center gap-2">
                {/* 🔵 Telegram-style unread dot */}
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}

                <span
                  className={`truncate ${
                    isUnread
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-800"
                  }`}
                >
                  {chat.name}
                </span>
              </div>

              {/* Last message */}
              <div
                className={`text-sm truncate pl-4 ${
                  isUnread ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {chat.last}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
