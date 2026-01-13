import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type {CallState, FromOffer} from "@/features/call/model/types.ts";

const initialState: CallState = {
  status: "idle",
  peerId: null,
  offer: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    outgoingCall(state, action: PayloadAction<string>) {
      if (state.status !== "idle") return;
      state.status = "calling";
      state.peerId = action.payload;
    },

    incomingOffer(state, action: PayloadAction<FromOffer>) {
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
