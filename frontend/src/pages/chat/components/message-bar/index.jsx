import { useDispatch, useSelector } from "react-redux";
import { chatData, addNewMessage } from "@/store/chatSlice";
import { useSocket } from "@/socketContext";
import { useState, useRef, useEffect } from "react";
import EmojiPicker from 'emoji-picker-react';
import { GrAttachment } from "react-icons/gr";
import { IoSend } from 'react-icons/io5';
import { RiEmojiStickerLine } from 'react-icons/ri';
import { selectUser } from "@/store/userSlice";
import { API_ENDPOINTS } from "@/lib/apiConfig";

const MessageBar = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const { selectedChatData } = useSelector(chatData);
    const { socket } = useSocket();

    const [message, setMessage] = useState("");
    const [isComposing, setIsComposing] = useState(false);
    const sendingRef = useRef(false);
    const [emojiStickerOpen, setEmojiStickerOpen] = useState(false);
    const emojiRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setEmojiStickerOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleAddEmoji = (emojiData) => {
        setMessage(msg => msg + emojiData.emoji);
    };

    const handleSendMessage = () => {
        if (sendingRef.current) return;
      
        if (!message.trim() || !(selectedChatData?.contactId || selectedChatData?._id)) {
            return;
        }

        // Get receiver ID - ensure it's a string, not an array
        let receiverId = selectedChatData?.contactId || selectedChatData._id;
        if (Array.isArray(receiverId)) {
            receiverId = receiverId[0];
        }
        
        const messageData = {
            content: message,
            receiver: [receiverId],
            messageType: "text",
            fileUrl: null,
            sender: user._id,
            createdAt: new Date().toISOString()
        };
        
        const currentMessage = message.trim();
        
        const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            content: currentMessage,
            sender: user._id,
            receiver: [receiverId],
            createdAt: new Date().toISOString(),
            messageType: "text"
        };
        dispatch(addNewMessage(optimisticMessage));
        
        setMessage("");
        
        sendingRef.current = true;
        setTimeout(() => { sendingRef.current = false; }, 500);
        
        socket.emit("sendMessage", messageData, () => {
            sendingRef.current = false;
        });
    };

    const handlePickFile = () => fileInputRef.current?.click();

    const handleUploadFile = async (e) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!(selectedChatData?.contactId || selectedChatData?._id)) return;
            
            setUploading(true);
            const form = new FormData();
            form.append("file", file);
            form.append("receiver", selectedChatData?.contactId || selectedChatData._id);

            const res = await fetch(API_ENDPOINTS.messages.upload, {
                method: 'POST',
                credentials: 'include',
                body: form,
            });
            
            if (!res.ok) throw new Error('Upload failed');
            
            const data = await res.json();
            
            // Add file message to UI
            if (data.message) {
                dispatch(addNewMessage(data.message));
            }
            
            e.target.value = '';
        } catch (err) {
            console.error("File upload error", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="px-8 h-[10vh] bg-transparent flex justify-center items-center relative">
            <div className="flex-1 flex items-center gap-2 pr-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-white rounded-full px-5 py-3 focus:border-none focus:outline-none"
                />
                
                {/* Icon buttons container - aligned to the right */}
                <div className="flex items-center gap-3">
                    {/* Emoji Picker */}
                    <div className="relative">
                        <button 
                            onClick={() => setEmojiStickerOpen(prev => !prev)} 
                            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                        >
                            <RiEmojiStickerLine className="text-xl text-white/70 hover:text-white transition-colors" />
                        </button>
                        {emojiStickerOpen && (
                            <div ref={emojiRef} className="absolute bottom-14 right-0 z-50">
                                <EmojiPicker onEmojiClick={handleAddEmoji} theme="dark" />
                            </div>
                        )}
                    </div>

                    {/* File Upload */}
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        className="hidden" 
                        onChange={handleUploadFile}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <button 
                        onClick={handlePickFile} 
                        disabled={uploading} 
                        className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 disabled:opacity-50"
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <GrAttachment className="text-lg text-white/70 hover:text-white transition-colors" />
                        )}
                    </button>
                </div>
            </div>
            
            {/* Send Button */}
            <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="ml-3 h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 text-white grid place-items-center shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
            >
                <IoSend className="text-lg"/>
            </button>
        </div>
    );
};

export default MessageBar;
