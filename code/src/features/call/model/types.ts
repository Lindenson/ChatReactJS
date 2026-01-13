type CallStatus = "idle" | "ringing" | "calling" | "connecting" | "in_call";

export interface CallState {
    status: CallStatus;
    peerId: string | null;
    offer: RTCSessionDescriptionInit | null;
}

export type IncomingWebRTCMessage =
    | { type: "call:offer"; from: string; offer: RTCSessionDescriptionInit }
    | { type: "call:answer"; from: string; answer: RTCSessionDescriptionInit }
    | { type: "call:ice"; from: string; candidate: RTCIceCandidateInit }
    | { type: "call:end"; from: string };

export type OutgoingWebRTCMessage =
    | { type: "call:offer"; to: string; offer: RTCSessionDescriptionInit }
    | { type: "call:answer"; to: string; answer: RTCSessionDescriptionInit }
    | { type: "call:ice"; to: string; candidate: RTCIceCandidateInit }
    | { type: "call:end"; to: string };

export type FromOffer = { from: string, offer: RTCSessionDescriptionInit }
export type FromAnswer = { from: string, answer: RTCSessionDescriptionInit }
export type FromCandidate = { from: string, candidate: RTCIceCandidateInit }