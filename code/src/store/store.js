import { configureStore } from "@reduxjs/toolkit";

// Reducers
import callReducer from "@/features/call/model/callSlice";
import wsReducer from "@/features/chat/model/websocketSlice";

// Middleware
import { callMiddleware } from "@/features/call/middleware/callMiddleware.js";
import { websocketMiddleware } from "@/features/chat/middleware/wsMiddleware.js";

export const store = configureStore({
  reducer: {
    call: callReducer,
    ws: wsReducer,
  },
  middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(websocketMiddleware, callMiddleware),
});

