import { useDispatch, useSelector } from "react-redux";
import { chatData, setSelectedChatMessages } from "@/store/chatSlice";
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
    const { socket } = useSocket();

    const [message, setMessage] = useState("");
    const [emojiStickerOpen, setEmojiStickerOpen] = useState(false);
    const emojiRef = useRef(null);

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
        console.log(message)
        console.log(selectedChatData)
        if (!message.trim() || !selectedChatData?.contactId) return;

        const messageData = {
            content: message,
            receiver: selectedChatData?.contactId,
            messageType: "text",
            fileUrl: null,
            sender: user._id
        };
        
        socket.emit("sendMessage", messageData);
        setMessage("");
    };

    return (
        <div className="px-8  h-[10vh] bg-[#1c1d25] flex justify-center items-center relative">
            <div className="flex-1  items-center gap-5 pr-5 flex bg-[#2a2b33] rounded-md relative">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-white rounded-lg px-4 py-4 
                    focus:border-none focus:outline-none"
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

                <button className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all">
                    <GrAttachment className="text-white text-2xl cursor-pointer" />
                </button>

            </div>
                <button
                    onClick={handleSendMessage}
                    className=" bg-[#8417ff] hover:bg-[#741bda] rounded-md focus:bg-[#741bda]  focus:border-none focus:outline-none p-4 focus:text-white duration-300 transition-all ml-2 text-white"
                >
                    <IoSend className="text-2xl"/>
                </button>
        </div>
    );
};

export default MessageBar;
