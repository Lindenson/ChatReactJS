import { incomingOffer, incomingAnswer, incomingRemoteEnd } from "@/features/call/model/callSlice.js";

export const callMiddleware = (store) => (next) => (action) => {
  const { dispatch } = store;

  if (action.type !== "ws/incoming") {
    return next(action);
  }

  const msg = action.payload;

  switch (msg.type) {
    case "call:offer":
      dispatch(incomingOffer(msg));
      break;

    case "call:answer":
      dispatch(incomingAnswer(msg));
      break;

    case "call:end":
      dispatch(incomingRemoteEnd());
      break;
  }

  return next(action);
};
