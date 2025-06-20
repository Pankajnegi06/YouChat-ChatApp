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
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/apiConfig";

function MessageContainer() {
  const dispatch = useDispatch();
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
      if (isSameChat) {
        // Use the functional update form to avoid stale state
        dispatch(addNewMessage(newMessage));
      }
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
            className={`border inline-block p-4 px-7 my-1 text-lg break-words ${
              isSender
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
            }`}
          >
            {messageText}
          </div>
          <div className="text-xs text-gray-600 mt-1">
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
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      {renderMessage()}
    </div>
  );
}

export default MessageContainer;
