import { useSocket } from "@/socketContext";
import { addNewMessage } from "@/store/chatSlice";
import {
  chatData,
  chatMessages,
  chatType,
  setSelectedChatMessages
} from "@/store/chatSlice";
import { selectUser } from "@/store/userSlice";
import axios from "axios";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import Rag from "@/components/ui/rag.jsx";

function MessageContainer() {
  const dispatch = useDispatch();
  const [showRag, setShowRag] = useState(false);
  const userInfo = useSelector(selectUser);
  const selectedChat = useSelector(chatData);
  const selectedChatType = useSelector(chatType);
  const selectedChatMessages = useSelector(chatMessages);
  const { socket } = useSocket();
  const scrollRef = useRef();

  const selectedChatId =
    selectedChat?.selectedChatData?.contactId ||
    selectedChat.selectedChatData?._id;

  // Fetch messages initially
  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await axios.post(
          API_ENDPOINTS.messages.getMessagesForContact,
          { id: selectedChatId },
          { withCredentials: true }
        );

        if (response.status === 200) {
          dispatch(setSelectedChatMessages(response.data));
        }
      } catch (error) {
        console.log(
          "Couldn't fetch messages",
          error.response?.data || error.message
        );
      }
    };

    if (selectedChatId && selectedChatType === "contact") {
      getMessages();
    }
  }, [selectedChatId, selectedChatType, dispatch]);

  // Auto scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatMessages.length]);

  // Socket listener to append new messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      // Ensure it belongs to the current chat
      const isSameChat = newMessage.receiver === selectedChatId || newMessage.sender === selectedChatId;
      if (!isSameChat) return;

      // Deduplicate by id if server echoes same message to sender and receiver
      dispatch((dispatchFn, getState) => {
        const existing = getState().chat.selectedChatMessages;
        const already = existing.some(m => (m._id && newMessage._id && m._id === newMessage._id));
        if (!already) {
          dispatch(addNewMessage(newMessage));
        }
      });
    };

    socket.on("receiveMessages", handleReceiveMessage);

    return () => {
      socket.off("receiveMessages", handleReceiveMessage);
    };
  }, [socket, selectedChatId, dispatch]);

  const renderDmMessages = (message) => {
    const messageText =
      Object.keys(message)
        .filter((key) => !isNaN(key))
        .map((key) => message[key])
        .join("") || message.content;

    const isSender = userInfo._id === message.sender;

    return (
      <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}>
        <div className="w-auto">
          <div
            className={`inline-block my-1 text-[15px] break-words rounded-2xl px-4 py-2.5 border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${
              isSender
                ? "bg-gradient-to-br from-violet-600/20 to-fuchsia-500/15 text-violet-100 border-violet-500/30"
                : "bg-white/5 text-white/85 border-white/10"
            }`}
          >
            {messageText}
          </div>
          <div className="text-[11px] text-white/50 mt-1">
            {moment(message.createdAt).format("LT")}
          </div>
        </div>
      </div>
    );
  };

  const renderGroupMessages = (message) => {
    return (
      <div className="text-sm text-gray-400">
        Group message rendering not implemented
      </div>
    );
  };

  const renderMessage = () => {
    let lastDate = null;

    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.createdAt).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <div
          key={message._id || index}
          ref={index === selectedChatMessages.length - 1 ? scrollRef : null}
        >
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.createdAt).format("LL")}
            </div>
          )}
          {selectedChatType === "contact"
            ? renderDmMessages(message)
            : renderGroupMessages(message)}
        </div>
      );
    });
  };
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full static">
    {renderMessage()}
    {showRag && <Rag />}
  </div>
  );
}

export default MessageContainer;
