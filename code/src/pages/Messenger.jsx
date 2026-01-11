import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import ChatList from "@/widgets/chatlist/ChatList.jsx";
import ChatWindow from "@/widgets/chatwindow/ChatWindow.jsx";
import ConfirmModal from "@/widgets/modal/ConfirmModal.jsx";

import { useChatMessages } from "@/features/chat/hooks/useChatMessages.js";
import { useUnreadChats } from "@/features/chat/hooks/useUnreadChats.js";

import { useWebRTC } from "@/features/call/hooks/useWebRTC";
import VideoCall from "@/features/call/ui/VideoCall";

import {
  sendChatMessage,
  deleteChatHistory,
  fetchChatContacts,
} from "@/features/chat/lib/chatApi.js";
import { clearIncoming } from "@/features/chat/model/websocketSlice";

export default function Messenger({ myId }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* ======================
     UI state
  ====================== */
  const [contacts, setContacts] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ======================
     Refs for WS handlers
  ====================== */
  const contactsRef = useRef([]);
  const selectedChatIdRef = useRef(null);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  /* ======================
     Derived
  ====================== */
  const isChatOpen = selectedChatId !== null;
  const peerId =
    selectedChatId !== null ? contacts[selectedChatId]?.name : null;
  const filteredChats = useMemo(
    () =>
      contacts.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [contacts, searchQuery]
  );
  const selectedChat = isChatOpen ? contacts[selectedChatId] : null;

  /* ======================
     Messages / unread
  ====================== */
  const { unreadChats, markUnread, markRead } = useUnreadChats();
  const { messagesMap, reloadChatHistory, handleIncomingMessage, clearChat } =
    useChatMessages();

  /* ======================
     WebRTC hook
  ====================== */
  const webRTC = useWebRTC({ dispatch });

  /* ======================
     Load contacts
  ====================== */
  useEffect(() => {
    let alive = true;
    fetchChatContacts(myId)
      .then((data) => alive && setContacts(data))
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [myId]);

  /* ======================
     WebSocket connect via Redux
  ====================== */
  useEffect(() => {
    if (!myId) return;
    const url = `${window.location.protocol === "https:" ? "wss" : "ws"}://${
      window.location.host
    }/ws?clientId=${encodeURIComponent(myId)}`;
    dispatch({
      type: "ws/connect",
      payload: { url },
      meta: { shouldReconnect: true },
    });
    return () => dispatch({ type: "ws/disconnect" });
  }, [myId, dispatch]);

  /* ======================
     Handle incoming WS messages
  ====================== */
  const lastIncoming = useSelector((state) => state.ws.lastIncoming);
  const callStatus = useSelector((state) => state.call.status);

  useEffect(() => {
    console.log("status " + callStatus);
  }, [callStatus]);

  useEffect(() => {
    if (!lastIncoming) return;

    const data = lastIncoming;

    /* ===== CHAT ===== */
    if (data.type === "message") {
      handleIncomingMessage({
        msg: data.payload,
        myId,
        contacts: contactsRef.current,
        onUnread: (chatId) => {
          if (chatId !== selectedChatIdRef.current) markUnread(chatId);
        },
      });
    }

    /* ===== CALLS ===== */
    webRTC.dispatchMessages(data);
    dispatch(clearIncoming());
  }, [lastIncoming]);

  /* ======================
     Reload history on reconnect
  ====================== */
  const wsStatus = useSelector((state) => state.ws.status);

  useEffect(() => {
    if (wsStatus !== "connected") return;

    if (selectedChatIdRef.current !== null) {
      reloadChatHistory({
        chatId: selectedChatIdRef.current,
        myId,
        contacts: contactsRef.current,
      }).catch(console.error);
    }
  }, [wsStatus, myId, reloadChatHistory]);

  /* ======================
     Chat actions
  ====================== */
  async function openChat(chatId) {
    setSelectedChatId(chatId);
    markRead(chatId);
    await reloadChatHistory({ chatId, myId, contacts: contactsRef.current });
  }

  async function sendMessage(text) {
    if (!isChatOpen || !text.trim()) return;
    setMessageInput("");
    //dispatch({
    //  type: "ws/send",
    //  payload: { type: "message", from: myId, to: peerId, text },
    //});
    await sendChatMessage({ from: myId, to: peerId, text });
  }

  async function deleteChat() {
    const chatId = selectedChatIdRef.current;
    const peer = peerId;
    if (!peer || chatId === null) return;

    await deleteChatHistory(myId, peer);
    clearChat(chatId);
    setSelectedChatId(null);
  }

  /* ======================
     Render
  ====================== */
  return (
    <div className="h-dvh w-screen flex overflow-hidden bg-gray-300">
      <ChatList
        chats={filteredChats}
        unreadChats={unreadChats}
        search={searchQuery}
        setSearch={setSearchQuery}
        selectedChat={selectedChatId}
        setSelectedChat={openChat}
        isChatOpen={isChatOpen}
        myName={myId}
        onLogout={() => navigate("/logout")}
      />

      <ChatWindow
        chat={selectedChat}
        messages={messagesMap}
        inputText={messageInput}
        setInputText={setMessageInput}
        sendMessage={sendMessage}
        setSelectedChat={setSelectedChatId}
        isChatOpen={isChatOpen}
        selectedChat={selectedChatId}
        onDeleteChat={() => setShowDeleteModal(true)}
        onCall={async () => {
          await webRTC.startCall(peerId);
        }}
      />

      {callStatus !== "idle" ? (
        <VideoCall
          localStream={webRTC.localStream}
          remoteStream={webRTC.remoteStream}
          onHangUp={webRTC.hangUp}
          acceptCall={async (call) => {
            await webRTC.handleOffer(call);
          }}
          rejectCall={(from) => webRTC.rejectCall(from)}
        />
      ) : null}

      {showDeleteModal && (
        <ConfirmModal
          title="Eliminar chat"
          message={`¿Eliminar historial con ${peerId}?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => deleteChat().then(() => setShowDeleteModal(false))}
        />
      )}
    </div>
  );
}
