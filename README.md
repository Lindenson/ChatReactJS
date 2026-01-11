# 💬📹 Real-Time Chat & Video Call Application

A real-time messaging and video calling application built with **React**, **Redux Toolkit**, **WebSocket**, and **WebRTC**.  
The project demonstrates a clean separation of concerns between UI, application state, and low-level real-time communication logic.

---

## ✨ Features

- 💬 **Real-time chat**
  - One-to-one messaging
  - Unread message tracking
  - Chat history loading & deletion
- 📹 **Video & audio calls (WebRTC)**
  - Incoming / outgoing calls
  - Call accept / reject flow
  - ICE candidate buffering
  - TURN / STUN support
- 🔁 **Robust state management**
  - Redux-based call state machine
  - Deterministic call lifecycle
- 🧠 **Safe WebRTC lifecycle**
  - Race-condition protection
  - Idempotent cleanup
  - Defensive signaling handling

---

## 🏗️ Architecture Overview

The project is intentionally split into **three independent layers**:

```
UI (React Components)
↓
Application State (Redux)
↓
Transport / Media Layer (WebRTC + WebSocket)
```


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
idle       // no active call
ringing    // incoming call, waiting for user action
calling    // outgoing call initiated
in_call    // WebRTC connection established


```
idle
 ├── incomingOffer → ringing
 └── outgoingCall  → calling

ringing
 ├── acceptCall → in_call
 └── reject / remoteEnd → idle

calling
 ├── incomingAnswer → in_call
 └── localEnd / remoteEnd → idle

in_call
 └── localEnd / remoteEnd / disconnect → idle
```

Redux is the single source of truth for:

UI rendering

Button availability

Modal visibility

Call permissions

🔌 WebRTC Layer (useWebRTC)

The useWebRTC hook is a low-level transport layer responsible only for:

PeerConnection lifecycle

Media stream handling

SDP (offer / answer)

ICE candidate buffering

WebRTC connection state

Important Design Rules

✅ Does NOT read Redux call status
✅ Does NOT control UI
✅ Does NOT trust the UI or signaling layer

It uses internal guards based on:

RTCPeerConnection state

signalingState

internal refs (pcRef, remotePeerIdRef)

This guarantees:

No double calls

No duplicate offers

Safe reconnection

Idempotent cleanup

📡 WebSocket Signaling

WebSocket is used for:

Chat messages

Call signaling events:

call:offer

call:answer

call:ice

call:end

All incoming signaling messages are:

Dispatched to Redux (for UI & state)

Forwarded to useWebRTC only when valid

🎥 Media Streams
Reactive Streams
const [localStream, setLocalStream] = useState(null);
const [remoteStream, setRemoteStream] = useState(null);


Streams are React state, not refs, so the UI automatically updates when:

Camera/microphone is ready

Remote peer connects

🧠 Defensive Programming

This project intentionally handles edge cases:

Double incoming offers

Offer while already in a call

Late ICE candidates

Answer after hang-up

Network disconnects

Peer crashes

All unsafe conditions are ignored or auto-rejected.

🖥️ UI Components

ChatList

Contacts

Unread counters

Search

ChatWindow

Messages

Send / delete

Start call

VideoCall

Incoming call modal

Video streams

Hang up

ConfirmModal

Reusable confirmation UI

🔐 TURN / STUN Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:<HOST>:3478",
      username: "user",
      credential: "pass",
    },
  ],
};

🧪 Key Principles Used

Separation of concerns

Finite state machines

Reactive UI

Idempotent cleanup

Race-condition safety

WebRTC best practices

🚀 Possible Extensions

Group calls

Screen sharing

Call reconnection

Call duration tracking

Push notifications

End-to-end encryption

📌 Summary

This project is not just a chat app —
it is a reference architecture for building reliable real-time applications with React, Redux, WebSocket, and WebRTC.

If you understand this codebase —
you understand how to build production-grade real-time systems.

Happy hacking 🚀
