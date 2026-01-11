import { useRef, useState, useCallback } from "react";

const TURN_HOST = window.location.hostname;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: `turn:${TURN_HOST}:3478`,
      username: "user",
      credential: "pass",
    },
  ],
};

export function useWebRTC({ dispatch }) {
  /* ======================
     Refs (NOT reactive)
  ====================== */
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const remotePeerIdRef = useRef(null);
  const pendingIceRef = useRef([]);
  const remoteReadyRef = useRef(false);

  /* ======================
     State (reactive)
  ====================== */
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  /* ======================
     WS send
  ====================== */
  const send = useCallback(
    (data) => {
      dispatch?.({ type: "ws/send", payload: data });
    },
    [dispatch]
  );

  /* ======================
     Init peer connection
  ====================== */
  const init = useCallback(async () => {
    if (pcRef.current) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    setLocalStream(stream); // 🔥 UI теперь знает о стриме

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onicecandidate = (e) => {
      if (!e.candidate || !remotePeerIdRef.current) return;

      send({
        type: "call:ice",
        to: remotePeerIdRef.current,
        candidate: e.candidate,
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        dispatch?.({ type: "call/webrtcConnected" });
      }

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        dispatch?.({ type: "call/incomingRemoteEnd" });
      }
    };
  }, [send]);

  /* ======================
     Start call (caller)
  ====================== */
  const startCall = useCallback(
    async (peerId) => {
      if (pcRef.current) return; // 🔒 уже в звонке
      dispatch?.({ type: "call/outgoingCall", payload: peerId });

      remotePeerIdRef.current = peerId;
      await init();

      const pc = pcRef.current;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      send({
        type: "call:offer",
        to: peerId,
        offer,
      });
    },
    [dispatch, init, send]
  );

  /* ======================
     Handle offer (callee)
  ====================== */
  const handleOffer = useCallback(
    async ({ from, offer }) => {
      if (pcRef.current) {
        // ❌ уже в соединении — auto-reject
        send({ type: "call:end", to: from });
        return;
      }

      dispatch?.({ type: "call/acceptCall" });

      remotePeerIdRef.current = from;
      await init();

      const pc = pcRef.current;
      await pc.setRemoteDescription(offer);
      remoteReadyRef.current = true;

      for (const c of pendingIceRef.current) {
        await pc.addIceCandidate(c);
      }
      pendingIceRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      send({
        type: "call:answer",
        to: from,
        answer,
      });
    },
    [dispatch, init, send]
  );

  /* ======================
     Handle answer
  ====================== */
  const handleAnswer = useCallback(async ({ from, answer }) => {
    if (!pcRef.current) return;
    if (pcRef.current.signalingState !== "have-local-offer") return;

    remotePeerIdRef.current = from;
    await pcRef.current.setRemoteDescription(answer);
    remoteReadyRef.current = true;

    for (const c of pendingIceRef.current) {
      await pcRef.current.addIceCandidate(c);
    }
    pendingIceRef.current = [];
  }, []);

  /* ======================
     Add ICE candidate
  ====================== */
  const addIce = useCallback(async ({ from, candidate }) => {
    if (!candidate) return;

    remotePeerIdRef.current ??= from;

    if (!pcRef.current || !remoteReadyRef.current) {
      pendingIceRef.current.push(candidate);
      return;
    }

    await pcRef.current.addIceCandidate(candidate);
  }, []);

  /* ======================
     End call (local cleanup)
  ====================== */
  const endCall = useCallback(() => {
    if (!pcRef.current) return;

    remotePeerIdRef.current = null;
    remoteReadyRef.current = false;
    pendingIceRef.current = [];

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  /* ======================
     Hang up
  ====================== */
  const hangUp = useCallback(() => {
    if (remotePeerIdRef.current) {
      send({
        type: "call:end",
        to: remotePeerIdRef.current,
      });
    }
    endCall();
    dispatch?.({ type: "call/localEnd" });
  }, [dispatch, endCall, send]);

  /* ======================
     Reject call
  ====================== */
  const rejectCall = useCallback(
    (from) => {
      send({ type: "call:end", to: from });
      dispatch?.({ type: "call/localEnd" });
    },
    [dispatch, send]
  );

  /* ======================
     WS dispatcher
  ====================== */
  const dispatchMessages = useCallback(
    (data) => {
      if (data.type === "call:answer") handleAnswer(data);
      if (data.type === "call:ice") addIce(data);
      if (data.type === "call:end") endCall();
    },
    [addIce, endCall, handleAnswer]
  );

  /* ======================
     API
  ====================== */
  return {
    localStream,
    remoteStream,
    startCall,
    hangUp,
    handleOffer,
    rejectCall,
    dispatchMessages,
    send,
  };
}
