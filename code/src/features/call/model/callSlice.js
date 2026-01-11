import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle", // idle | ringing | calling | connecting | in_call
  peerId: null,
  offer: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    outgoingCall(state, action) {
      if (state.status !== "idle") return;
      state.status = "calling";
      state.peerId = action.payload;
    },

    incomingOffer(state, action) {
      if (state.status !== "idle") return;
      state.status = "ringing";
      state.peerId = action.payload.from;
      state.offer = action.payload.offer;
    },

    acceptCall(state) {
      if (state.status !== "ringing") return;
      state.status = "connecting";
    },

    incomingAnswer(state) {
      if (state.status !== "calling") return;
      state.status = "connecting";
    },

    webrtcConnected(state) {
      if (state.status !== "connecting") return;
      state.status = "in_call";
      state.offer = null;
    },

    localEnd() {
      return initialState;
    },

    incomingRemoteEnd() {
      return initialState;
    },
  },
});

export const {
  outgoingCall,
  incomingOffer,
  incomingAnswer,
  incomingRemoteEnd,
  acceptCall,
  localEnd,
  webrtcConnected,
} = callSlice.actions;

export default callSlice.reducer;
