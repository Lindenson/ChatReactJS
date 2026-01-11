import { createSlice } from "@reduxjs/toolkit";

const websocketSlice = createSlice({
  name: "ws",
  initialState: {
    status: "disconnected", // connecting | connected
    lastIncoming: null, // последнее сообщение ОТ сервера
    lastOutgoing: null, // последнее сообщение ОТ клиента
    error: null,
  },
  reducers: {
    connecting(state) {
      state.status = "connecting";
      state.error = null;
    },

    connected(state) {
      state.status = "connected";
      state.error = null;
    },

    disconnected(state) {
      state.status = "disconnected";
    },

    incoming(state, action) {
      state.lastIncoming = action.payload;
    },

    outgoing(state, action) {
      state.lastOutgoing = action.payload;
    },

    error(state, action) {
      state.error = action.payload;
    },

    clearIncoming(state) {
      state.lastIncoming = null;
    },

    clearOutgoing(state) {
      state.lastOutgoing = null;
    },
  },
});

export const {
  connecting,
  connected,
  disconnected,
  incoming,
  outgoing,
  error,
  clearIncoming,
  clearOutgoing,
} = websocketSlice.actions;

export default websocketSlice.reducer;
