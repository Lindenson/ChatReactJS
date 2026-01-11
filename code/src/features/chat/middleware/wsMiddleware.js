import {
  connecting,
  connected,
  disconnected,
  incoming,
  outgoing,
  error as wsError,
} from "@/features/chat/model/websocketSlice.js";

let socket = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;

const MAX_RECONNECT_DELAY = 30_000;
const DELAY_STEP_MS = 500;

export const websocketMiddleware = (store) => (next) => (action) => {
  const { dispatch } = store;

  const scheduleReconnect = (url) => {
    reconnectAttempts += 1;
    const delay = Math.min(
      DELAY_STEP_MS * 2 ** reconnectAttempts,
      MAX_RECONNECT_DELAY
    );
    console.log(`🔁 WS reconnect #${reconnectAttempts} in ${delay}ms`);
    reconnectTimeout = setTimeout(() => connect(url, true), delay);
  };

  const connect = (url, shouldReconnect) => {
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    dispatch(connecting());

    socket = new WebSocket(url);

    socket.onopen = () => {
      reconnectAttempts = 0;
      dispatch(connected());
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        dispatch(incoming(data));
      } catch {
        dispatch(wsError({ message: "WS parse error" }));
      }
    };

    socket.onerror = () => {
      dispatch(wsError({ message: "WebSocket error" }));
    };

    socket.onclose = (event) => {
      socket = null;
      dispatch(disconnected());

      if (shouldReconnect) {
        scheduleReconnect(url);
      }
    };
  };

  switch (action.type) {
    case "ws/connect": {
      const { url } = action.payload;
      const shouldReconnect = Boolean(action.meta?.shouldReconnect);

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      reconnectAttempts = 0;
      connect(url, shouldReconnect);
      break;
    }

    case "ws/disconnect": {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      reconnectAttempts = 0;

      if (socket) {
        socket.close(1000, "Client disconnect");
        socket = null;
      }

      dispatch(disconnected());
      break;
    }

    case "ws/send": {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(action.payload));

        dispatch(outgoing(action.payload));
      }
      break;
    }
  }

  return next(action);
};
