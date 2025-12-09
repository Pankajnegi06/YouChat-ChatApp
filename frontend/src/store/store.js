import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import chatSlice from "./chatSlice";

 const store = configureStore({
    reducer: {
        user: userSlice,
        chat: chatSlice, // Changed from selectedChat to chat
    },
});
export default store