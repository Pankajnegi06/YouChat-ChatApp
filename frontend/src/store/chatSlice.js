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
        // Add a new contact to DMs if not already present
        addContactToDMs: (state, action) => {
            const newContact = action.payload;
            
            // Extract ID from contactId (could be array or string) or _id
            const getIdFromContact = (contact) => {
                if (!contact) return null;
                const cid = contact.contactId || contact._id;
                if (Array.isArray(cid)) return cid[0]?.toString();
                if (typeof cid === 'object') return cid._id?.toString() || cid.toString();
                return cid?.toString();
            };
            
            const newContactId = getIdFromContact(newContact);
            
            // Check if contact already exists by comparing extracted IDs
            const exists = state.DirectMessagesContacts.some(c => {
                const existingId = getIdFromContact(c);
                return existingId === newContactId;
            });
            
            if (!exists && newContactId) {
                // Add to beginning of list (most recent first)
                state.DirectMessagesContacts.unshift(newContact);
            }
        },
        clearSelectedChat: (state) => {
            state.selectedChatData = undefined;
            state.selectedChatMessages = [];
            state.selectedChatType = undefined;
        },

        addNewMessage: (state, action) => {
            const message = action.payload;
        
            // Helper to extract ID from sender/receiver (for comparison)
            const getSenderId = (sender) => {
                if (!sender) return null;
                return typeof sender === 'object' ? sender._id : sender;
            };
            
            const getReceiverId = (receiver) => {
                if (!receiver) return null;
                if (Array.isArray(receiver)) {
                    const first = receiver[0];
                    return typeof first === 'object' ? first?._id : first;
                }
                return typeof receiver === 'object' ? receiver._id : receiver;
            };

            // Preserve the full sender object for display purposes
            const newMessage = {
                _id: message._id,
                content: message.content,
                createdAt: message.createdAt || new Date().toISOString(),
                receiver: message.receiver, // Keep original for lookup
                sender: message.sender, // Keep full object for display
                fileUrl: message.fileUrl || null,
                messageType: message.messageType || 'text'
            };

            const messageId = message._id;
            const senderId = getSenderId(message.sender);

            // Check if this message already exists by ID
            const existingIndex = state.selectedChatMessages.findIndex(
                m => m._id === messageId
            );
            
            if (existingIndex !== -1) {
                // Message with same ID exists, replace it
                state.selectedChatMessages[existingIndex] = newMessage;
                return;
            }

            // For server messages, check if there's a matching temp message to replace
            // Match by content, sender, and approximate time (within 10 seconds)
            if (!messageId?.startsWith('temp-')) {
                const tempIndex = state.selectedChatMessages.findIndex(m => {
                    if (!m._id?.startsWith('temp-')) return false;
                    const mSenderId = getSenderId(m.sender);
                    const sameContent = m.content === message.content;
                    const sameSender = mSenderId === senderId;
                    const timeDiff = Math.abs(new Date(m.createdAt) - new Date(message.createdAt));
                    return sameContent && sameSender && timeDiff < 10000;
                });
                
                if (tempIndex !== -1) {
                    // Replace temp message with confirmed message
                    state.selectedChatMessages[tempIndex] = newMessage;
                    return;
                }
            }
        
            state.selectedChatMessages.push(newMessage);
        },
        
        deleteMessage: (state, action) => {
            const messageId = action.payload;
            state.selectedChatMessages = state.selectedChatMessages.filter(
                msg => msg._id !== messageId
            );
        }
    },
});

export const {
    clearSelectedChat,
    setSelectedChatData,
    setSelectedChatMessages,
    setSelectedChatType,
    setDirectMessagesContacts,
    addContactToDMs,
    addNewMessage,
    deleteMessage
} = chatSlice.actions;

export default chatSlice.reducer;

export const chatData = (state) => state.chat;
export const chatType = (state) => state.chat.selectedChatType;
export const chatMessages = (state) => state.chat.selectedChatMessages;
export const DirectMessages = (state) => state.chat.DirectMessagesContacts;

