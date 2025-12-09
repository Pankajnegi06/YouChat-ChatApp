import { createSlice } from "@reduxjs/toolkit";

const InitialValue = {
    selectedChatType: undefined,
    selectedChatMessages: [],
    selectedChatData: undefined,
    DirectMessagesContacts:[]
};

const chatSlice = createSlice({
    name: "chat",
    initialState: InitialValue,
    reducers: {
        setSelectedChatType: (state, action) => {
            state.selectedChatType = action.payload;
        },
        setSelectedChatMessages: (state, action) => {
            state.selectedChatMessages = action.payload;
        },
        setSelectedChatData: (state, action) => {
            state.selectedChatData = action.payload;
        },
        setDirectMessagesContacts:(state,action)=>{
            state.DirectMessagesContacts = action.payload
        },
        clearSelectedChat: (state) => {
            state.selectedChatData = undefined;
            state.selectedChatMessages = [];
            state.selectedChatType = undefined;
        },

        addNewMessage: (state, action) => {
            const message = action.payload;
        
            const newMessage = {
                _id: message._id, // Optional: preserve original ID if available
                content: message.content,
                createdAt: message.createdAt || new Date().toISOString(), // fallback for real-time messages
                receiver: message.receiver?.[0]?._id || null,
                sender: message.sender?._id || null
            };
        
            state.selectedChatMessages.push(newMessage);
        }
    },
});

export const {
    clearSelectedChat,
    setSelectedChatData,
    setSelectedChatMessages,
    setSelectedChatType,
    setDirectMessagesContacts,
    addNewMessage 
} = chatSlice.actions;

export default chatSlice.reducer;

export const chatData = (state) => state.chat;
export const chatType = (state) => state.chat.selectedChatType;
export const chatMessages = (state) => state.chat.selectedChatMessages;
export const DirectMessages = (state) => state.chat.DirectMessagesContacts;

