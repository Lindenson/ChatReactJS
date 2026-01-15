import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";

import ChatList from "@/features/chat/ui/ChatList.jsx";
import ChatWindow from "@/features/chat/ui/ChatWindow.jsx";
import ConfirmModal from "@/widgets/modal/ConfirmModal.jsx";
import VideoCall from "@/features/call/ui/VideoCall";

import {useChat} from "@/features/chat/hooks";
import {useWebRTC} from "@/features/call/hooks";

import type {RootState} from "@/store/store.ts";
import type {FromOffer} from "@/features/call/model/types";

import {useWebSocketConnection} from "@/infrastructure/useWebSocketConnection.ts";


export default function Messenger() {
    const navigate = useNavigate();

    /* ======================
       Chat hook
    ====================== */
    const chat = useChat();

    /* ======================
       WebRTC hook
    ====================== */
    const webRTC = useWebRTC({dispatch: undefined});

    /* ======================
       Delete modal
    ====================== */
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    /* ======================
    Call status from Redux
    ====================== */
    const callStatus = useSelector((state: RootState) => state.call.status);

    /* ======================
    WebSocket connection
    ====================== */
    useWebSocketConnection();

    /* ======================
       Derived
    ====================== */
    const isChatOpen = chat.isChatOpen;
    const peerContact = chat.selectedChat ?? null;
    const myName = useSelector((state: RootState) => state.user.name);

    /* ======================
       Render
    ====================== */
    return (
        <div className="h-dvh w-screen flex overflow-hidden bg-gray-300">
            {/* ===== Chat List ===== */}
            <ChatList
                chats={chat.filteredChats}
                unreadChats={chat.unreadChats}
                search={chat.searchQuery}
                setSearch={chat.setSearchQuery}
                selectedChat={chat.selectedChatId}
                setSelectedChat={chat.openChat}
                isChatOpen={isChatOpen}
                myName={myName}
                onLogout={() => navigate("/logout")}
            />

            {/* ===== Chat Window ===== */}
            <ChatWindow
                chat={chat.selectedChat}
                messages={chat.messagesMap}
                inputText={chat.messageInput}
                setInputText={chat.setMessageInput}
                sendMessage={chat.sendMessage}
                setSelectedChat={chat.setSelectedChatId}
                isChatOpen={isChatOpen}
                selectedChat={chat.selectedChatId}
                onDeleteChat={() => setShowDeleteModal(true)}
                onCall={async () => {
                    if (peerContact) await webRTC.startCall(peerContact.name);
                }}
            />

            {/* ===== Video Call ===== */}
            {callStatus !== "idle" && (
                <VideoCall
                    localStream={webRTC.localStream}
                    remoteStream={webRTC.remoteStream}
                    onHangUp={webRTC.hangUp}
                    acceptCall={async (call: FromOffer) => await webRTC.handleOffer(call)}
                    rejectCall={(from: string) => webRTC.rejectCall(from)}
                />
            )}

            {/* ===== Delete Confirmation Modal ===== */}
            {showDeleteModal && peerContact && (
                <ConfirmModal
                    title="Eliminar chat"
                    message={`¿Eliminar historial con ${peerContact.name}?`}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={async () => {
                        await chat.deleteChat();
                        setShowDeleteModal(false);
                    }}
                />
            )}
        </div>
    );
}
