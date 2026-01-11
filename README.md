
# 💬📹 Real-Time Chat & Video Call Application

A real-time messaging and video calling application built with **React**, **Redux Toolkit**, **WebSocket**, and **WebRTC**. The project demonstrates a clean separation of concerns between UI, application state, and low-level real-time communication logic.

---

## ✨ Features

- 💬 **Real-time chat**: one-to-one messaging, unread message tracking, chat history loading & deletion  
- 📹 **Video & audio calls (WebRTC)**: incoming/outgoing calls, call accept/reject flow, ICE candidate buffering, TURN/STUN support  
- 🔁 **Robust state management**: Redux-based call state machine, deterministic call lifecycle  
- 🧠 **Safe WebRTC lifecycle**: race-condition protection, idempotent cleanup, defensive signaling handling

---

## 🏗️ Architecture Overview

The project is split into **three independent layers**:

UI (React Components)
↓
Application State (Redux)
↓
Transport / Media Layer (WebRTC + WebSocket)

yaml
Copy code

Each layer has a single responsibility and does **not leak concerns** into the others.

---

## 🧩 Core Technologies

- **React** — UI rendering & hooks  
- **Redux Toolkit** — global state & call state machine  
- **WebSocket** — signaling & chat transport  
- **WebRTC** — peer-to-peer media (video/audio)  
- **STUN / TURN** — NAT traversal

---

## 🔁 Call State Machine (Redux)

Call flow is modeled as a **finite state machine** inside Redux.

### Call States

```ts
// idle       // no active call
// ringing    // incoming call, waiting for user action
// calling    // outgoing call initiated
// in_call    // WebRTC connection established

idle
 ├── incomingOffer → ringing
 └── outgoingCall → calling

ringing
 ├── acceptCall → in_call
 └── reject / remoteEnd → idle

calling
 ├── incomingAnswer → in_call
 └── localEnd / remoteEnd → idle

in_call
 └── localEnd / remoteEnd / disconnect → idle

Redux is the single source of truth for: UI rendering, button availability, modal visibility, call permissions.
```

## 🔌 WebRTC Layer (useWebRTC)
The useWebRTC hook is a low-level transport layer responsible only for: peer connection lifecycle, media stream handling, SDP (offer/answer), ICE candidate buffering, WebRTC connection state.

Important Design Rules
✅ Does NOT read Redux call status
✅ Does NOT control UI
✅ Does NOT trust the UI or signaling layer

It uses internal guards based on RTCPeerConnection state, signalingState, internal refs (pcRef, remotePeerIdRef). This guarantees no double calls, no duplicate offers, safe reconnection, and idempotent cleanup.

📡 WebSocket Signaling
WebSocket is used for chat messages and call signaling events (call:offer, call:answer, call:ice, call:end). All incoming signaling messages are dispatched to Redux (for UI & state) and forwarded to useWebRTC only when valid.

## 🎥 Media Streams
Reactive streams are managed via React state:

```ts
const [localStream, setLocalStream] = useState(null);
const [remoteStream, setRemoteStream] = useState(null);
Streams are React state, so the UI automatically updates when the camera/microphone is ready or the remote peer connects.
```

## 🧠 Defensive Programming
The project handles edge cases: double incoming offers, offer while already in a call, late ICE candidates, answer after hang-up, network disconnects, peer crashes. Unsafe conditions are ignored or auto-rejected.

## 🖥️ UI Components
ChatList — contacts, unread counters, search

ChatWindow — messages, send/delete, start call

VideoCall — incoming call modal, video streams, hang up

ConfirmModal — reusable confirmation UI

## 🔐 TURN / STUN Configuration

```ts
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:<HOST>:3478", username: "user", credential: "pass" }
  ]
};
```

## 🧪 Key Principles Used
Separation of concerns, finite state machines, reactive UI, idempotent cleanup, race-condition safety, WebRTC best practices.

### 🚀 Possible Extensions
Group calls

Screen sharing

Call reconnection

Call duration tracking

Push notifications

End-to-end encryption

### 📌 Summary
This project is not just a chat app — it is a reference architecture for building reliable real-time applications with React, Redux, WebSocket, and WebRTC. If you understand this codebase, you understand how to build production-grade real-time systems.

Happy hacking 🚀
