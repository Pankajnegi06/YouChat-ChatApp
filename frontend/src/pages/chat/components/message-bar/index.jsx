import { useDispatch, useSelector } from "react-redux";
import { chatData, addNewMessage } from "@/store/chatSlice";
import { useSocket } from "@/socketContext";
import { useState, useRef, useEffect } from "react";
import EmojiPicker from 'emoji-picker-react';
import { GrAttachment } from "react-icons/gr";
import { IoSend } from 'react-icons/io5';
import { RiEmojiStickerLine } from 'react-icons/ri';
import { selectUser } from "@/store/userSlice";

const MessageBar = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const { selectedChatData } = useSelector(chatData);
    const currentMessages = useSelector(state => state.chat.selectedChatMessages);
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
        if (sendingRef.current) return; // prevent rapid double sends
        console.log("Message content:", message);
        console.log("Selected chat data:", selectedChatData);
      
        if (!message.trim() || !(selectedChatData?.contactId || selectedChatData?._id)) {
            console.log("Missing message content or contact ID");
            return;
        }
        

        // Format the message properly for the server
        // The receiver must be an array of IDs to match the Message schema
        const messageData = {
            content: message,
            receiver: [selectedChatData?.contactId || selectedChatData._id], // Array with single ID to match schema
            messageType: "text",
            fileUrl: null,
            sender: user._id,
            createdAt: new Date().toISOString()
        };
        
        console.log("Sending message to server:", messageData);
        
        // Send message to server
        sendingRef.current = true;
        socket.emit("sendMessage", messageData, () => {
            // optional ack callback
            sendingRef.current = false;
        });
        // Clear input field
        setMessage("");
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

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/messages/upload`, {
                method: 'POST',
                credentials: 'include',
                body: form,
            });
            if (!res.ok) throw new Error('Upload failed');
            e.target.value = '';
        } catch (err) {
            console.error("File upload error", err);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="px-8 h-[10vh] bg-transparent flex justify-center items-center relative">
            <div className="flex-1 items-center gap-3 pr-3 flex rounded-full border border-white/10 bg-white/5 backdrop-blur-xl relative">
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
                    className="flex-1 bg-transparent text-white rounded-full px-4 py-3 focus:border-none focus:outline-none"
                />
                
                <div className="relative">
                    <button onClick={() => setEmojiStickerOpen(prev => !prev)} className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all">
                        <RiEmojiStickerLine className="cursor-pointer text-2xl text-white" />
                    </button>
                    {emojiStickerOpen && (
                        <div ref={emojiRef} className="absolute bottom-12 right-0 z-50">
                            <EmojiPicker onEmojiClick={handleAddEmoji} />
                        </div>
                    )}
                </div>

                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFile} />
                <button onClick={handlePickFile} disabled={uploading} className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all disabled:opacity-50">
                    <GrAttachment className="text-white/80 text-2xl cursor-pointer" />
                </button>

            </div>
                <button
                    onClick={handleSendMessage}
                    className="ml-2 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-purple-600 hover:brightness-110 active:brightness-95 text-white grid place-items-center shadow-[0_8px_30px_-10px_rgba(139,92,246,0.7)]"
                >
                    <IoSend className="text-xl"/>
                </button>
        </div>
    );
};

export default MessageBar;
