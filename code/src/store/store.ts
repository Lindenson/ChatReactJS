import {configureStore} from "@reduxjs/toolkit";

// Reducers
import userReducer from "@/features/auth/slices/userSlice";
import callReducer from "@/features/call/model/slices/callSlice";
import wsReducer from "@/features/chat/model/slices/websocketSlice";
import outboxReducer, {hydrateOutbox, markPersisted} from "@/features/chat/model/slices/outboxSlice";


// Middleware
import {callMiddleware} from "@/features/call/middleware/callMiddleware";
import {websocketMiddleware} from "@/infrastructure/middleware/wsMiddleware.ts";

// DB functions
import {loadOutboxFromDB, saveOutboxToDB} from "@/features/chat/db/db";


export const store = configureStore({
    reducer: {
        call: callReducer,
        ws: wsReducer,
        outbox: outboxReducer,
        user: userReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(websocketMiddleware, callMiddleware),
});


store.subscribe(() => {
    const state = store.getState().outbox;

    if (state.outboxVersion !== state.persistedVersion) {
        saveOutboxToDB(state).then(() => {
            store.dispatch(markPersisted());
        });
    }
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export async function hydrateStore() {
    const saved = await loadOutboxFromDB();
    if (saved) {
        store.dispatch(hydrateOutbox(saved));
    }
}

