import { useSocket } from "@/socketContext";
import { addNewMessage, deleteMessage, addContactToDMs } from "@/store/chatSlice";
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
import { Trash2 } from "lucide-react";

function MessageContainer() {
  const dispatch = useDispatch();
  const [showRag, setShowRag] = useState(false);
  const userInfo = useSelector(selectUser);
  const selectedChat = useSelector(chatData);
  const selectedChatType = useSelector(chatType);
  const selectedChatMessages = useSelector(chatMessages);
  const { socket } = useSocket();
  const scrollRef = useRef();
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, messageId: null, canDelete: false });

  // Get selected chat ID - ensure it's a string, not an array
  const getRawChatId = () => {
    const rawId = selectedChat?.selectedChatData?.contactId || selectedChat.selectedChatData?._id;
    // If it's an array, get the first element
    if (Array.isArray(rawId)) {
      return rawId[0];
    }
    return rawId;
  };
  const selectedChatId = getRawChatId();

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, messageId: null, canDelete: false });
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Fetch messages initially
  useEffect(() => {
    const getMessages = async () => {
      try {
        let response;
        if (selectedChatType === "contact") {
          response = await axios.post(
            API_ENDPOINTS.messages.getMessagesForContact,
            { id: selectedChatId },
            { withCredentials: true }
          );
        } else if (selectedChatType === "channel") {
          response = await axios.post(
            API_ENDPOINTS.messages.getGroupMessages,
            { groupId: selectedChatId },
            { withCredentials: true }
          );
        }

        if (response?.status === 200) {
          dispatch(setSelectedChatMessages(response.data));
        }
      } catch (error) {
        console.log(
          "Couldn't fetch messages",
          error.response?.data || error.message
        );
      }
    };

    if (selectedChatId && (selectedChatType === "contact" || selectedChatType === "channel")) {
      getMessages();
    }
  }, [selectedChatId, selectedChatType, dispatch]);

  // Auto scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatMessages.length]);

  // Socket listener to append new messages
  useEffect(() => {
    if (!socket) {
      console.log('Socket not available yet in message-container');
      return;
    }
    
    console.log('Setting up socket listener for receiveMessages, selectedChatId:', selectedChatId);

    const handleReceiveMessage = (newMessage) => {
      console.log('=== RECEIVED MESSAGE VIA SOCKET ===');
      console.log('Message:', newMessage);
      console.log('selectedChatId:', selectedChatId);
      console.log('userInfo._id:', userInfo._id);
      console.log('selectedChatType:', selectedChatType);
      
      // Extract sender ID - handle both object and string formats
      const senderId = typeof newMessage.sender === 'object' 
        ? newMessage.sender?._id 
        : newMessage.sender;
      
      // Log raw receiver for debugging
      console.log('Raw newMessage.receiver:', newMessage.receiver);
      
      // Extract receiver IDs - handle array of objects or strings
      // Also filter out undefined/null values
      let receiverIds = [];
      if (Array.isArray(newMessage.receiver)) {
        receiverIds = newMessage.receiver
          .map(r => typeof r === 'object' ? r?._id : r)
          .filter(Boolean);
      } else if (newMessage.receiver) {
        const rid = typeof newMessage.receiver === 'object' ? newMessage.receiver?._id : newMessage.receiver;
        if (rid) receiverIds.push(rid);
      }
      
      console.log('senderId:', senderId);
      console.log('receiverIds:', receiverIds);
      
      // For individual chats:
      // - I sent the message: senderId === userInfo._id AND receiverIds includes selectedChatId
      // - I received the message: senderId === selectedChatId AND receiverIds includes userInfo._id
      
      // For group chats:
      // - Message is to the group I'm viewing: receiverIds includes selectedChatId (groupId)
      
      const isSenderMe = senderId === userInfo._id;
      const isSenderCurrentChat = senderId === selectedChatId;
      const amIReceiver = receiverIds.includes(userInfo._id);
      const isToCurrentChat = receiverIds.includes(selectedChatId);
      
      console.log('isSenderMe:', isSenderMe);
      console.log('isSenderCurrentChat:', isSenderCurrentChat);
      console.log('amIReceiver:', amIReceiver);
      console.log('isToCurrentChat:', isToCurrentChat);
      
      let shouldAddMessage = false;
      
      if (selectedChatType === "channel") {
        // Group chat: add if message is to this group
        shouldAddMessage = isToCurrentChat;
      } else {
        // Individual chat: add if I sent to this person OR this person sent to me
        shouldAddMessage = (isSenderMe && isToCurrentChat) || (isSenderCurrentChat && amIReceiver);
      }
      
      // Auto-add sender to DMs list if I received a message from someone new
      // (only for individual chats, not group messages)
      if (!isSenderMe && amIReceiver && selectedChatType !== "channel") {
        const senderData = typeof newMessage.sender === 'object' ? newMessage.sender : { _id: senderId };
        if (senderData._id || senderData.email) {
          dispatch(addContactToDMs({
            contactId: senderData._id,
            _id: senderData._id,
            firstName: senderData.firstName || '',
            lastName: senderData.lastName || '',
            email: senderData.email || '',
            image: senderData.image || '',
            color: senderData.color || 0
          }));
        }
      }
      
      console.log('shouldAddMessage:', shouldAddMessage);
      
      if (!shouldAddMessage) {
        console.log('Message not for current chat, ignoring');
        return;
      }

      console.log('Adding new message to chat!');
      dispatch(addNewMessage(newMessage));
    };

    socket.on("receiveMessages", handleReceiveMessage);

    return () => {
      socket.off("receiveMessages", handleReceiveMessage);
    };
  }, [socket, selectedChatId, selectedChatType, userInfo._id, dispatch]);

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
    const canDelete = userInfo._id === senderId && !message._id?.startsWith('temp-');
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      messageId: message._id,
      canDelete
    });
  };

  // Direct delete function that takes messageId
  const deleteMessageById = async (msgId) => {
    if (!msgId) return;
    
    try {
      const response = await axios.post(
        API_ENDPOINTS.messages.delete,
        { messageId: msgId },
        { withCredentials: true }
      );
      
      if (response.status === 200) {
        dispatch(deleteMessage(msgId));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!contextMenu.messageId || !contextMenu.canDelete) return;
    await deleteMessageById(contextMenu.messageId);
    setContextMenu({ show: false, x: 0, y: 0, messageId: null, canDelete: false });
  };

  // Helper to get file name from URL
  const getFileName = (url) => {
    if (!url) return 'File';
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    return name.split('?')[0] || 'File';
  };

  // Helper to check if file is an image
  const isImageFile = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  };

  // Helper to get file icon based on extension
  const getFileIcon = (url) => {
    if (!url) return '📄';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf')) return '📕';
    if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx')) return '📘';
    if (lowerUrl.includes('.xls') || lowerUrl.includes('.xlsx')) return '📗';
    if (lowerUrl.includes('.ppt') || lowerUrl.includes('.pptx')) return '📙';
    if (lowerUrl.includes('.txt')) return '📝';
    if (lowerUrl.includes('.zip') || lowerUrl.includes('.rar')) return '📦';
    return '📄';
  };

  const renderFileMessage = (message, isSender) => {
    const fileUrl = message.fileUrl;
    
    if (!fileUrl) return null;

    if (isImageFile(fileUrl)) {
      return (
        <div 
          className={`max-w-[300px] rounded-xl overflow-hidden border shadow-lg cursor-pointer hover:opacity-90 transition-opacity ${
            isSender ? 'border-violet-500/30' : 'border-white/10'
          }`}
          onClick={() => window.open(fileUrl, '_blank')}
        >
          <img 
            src={fileUrl} 
            alt="Shared image"
            className="w-full h-auto max-h-[300px] object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    const fileName = getFileName(fileUrl);
    const fileIcon = getFileIcon(fileUrl);

    return (
      <div 
        className={`flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm cursor-pointer hover:bg-white/5 transition-all ${
          isSender 
            ? 'bg-gradient-to-br from-violet-600/20 to-fuchsia-500/15 border-violet-500/30' 
            : 'bg-white/5 border-white/10'
        }`}
        onClick={() => window.open(fileUrl, '_blank')}
      >
        <div className="text-3xl">{fileIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{fileName}</p>
          <p className="text-xs text-white/50">Click to open</p>
        </div>
        <div className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
      </div>
    );
  };

  const renderDmMessages = (message) => {
    const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
    const isSender = userInfo._id === senderId;
    const isFileMessage = message.messageType === 'file' || message.fileUrl;
    const messageText =
      Object.keys(message)
        .filter((key) => !isNaN(key))
        .map((key) => message[key])
        .join("") || message.content;

    return (
      <div 
        className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2 group`}
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        <div className="w-auto max-w-[70%] relative">
          {/* Delete button on hover (only for sender's messages) */}
          {isSender && !message._id?.startsWith('temp-') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteMessageById(message._id);
              }}
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-red-500/20 border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
          
          {isFileMessage ? (
            renderFileMessage(message, isSender)
          ) : (
            <div
              className={`inline-block my-1 text-[15px] break-words rounded-2xl px-4 py-2.5 border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${
                isSender
                  ? "bg-gradient-to-br from-violet-600/20 to-fuchsia-500/15 text-violet-100 border-violet-500/30"
                  : "bg-white/5 text-white/85 border-white/10"
              }`}
            >
              {messageText}
            </div>
          )}
          <div className={`text-[11px] text-white/50 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
            {moment(message.createdAt).format("LT")}
          </div>
        </div>
      </div>
    );
  };

  const renderGroupMessages = (message) => {
    const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
    const isSender = userInfo._id === senderId;
    const senderName = typeof message.sender === 'object' 
      ? (message.sender?.firstName || message.sender?.email || 'Unknown')
      : 'Unknown';
    const isFileMessage = message.messageType === 'file' || message.fileUrl;
    const messageText =
      Object.keys(message)
        .filter((key) => !isNaN(key))
        .map((key) => message[key])
        .join("") || message.content;

    return (
      <div 
        className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3 group`}
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        <div className={`flex gap-2 max-w-[70%] ${isSender ? 'flex-row-reverse' : ''}`}>
          {!isSender && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-violet-300 uppercase">
                {senderName.charAt(0)}
              </span>
            </div>
          )}
          
          <div className="flex flex-col relative">
            {/* Delete button on hover */}
            {isSender && !message._id?.startsWith('temp-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMessageById(message._id);
                }}
                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-red-500/20 border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
            
            {!isSender && (
              <span className="text-xs text-violet-400 mb-1 ml-1">{senderName}</span>
            )}
            
            {isFileMessage ? (
              renderFileMessage(message, isSender)
            ) : (
              <div
                className={`inline-block text-[15px] break-words rounded-2xl px-4 py-2.5 border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${
                  isSender
                    ? "bg-gradient-to-br from-violet-600/20 to-fuchsia-500/15 text-violet-100 border-violet-500/30"
                    : "bg-white/5 text-white/85 border-white/10"
                }`}
              >
                {messageText}
              </div>
            )}
            
            <div className={`text-[11px] text-white/50 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
              {moment(message.createdAt).format("LT")}
            </div>
          </div>
        </div>
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
      
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed z-50 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.canDelete ? (
            <button
              onClick={handleDeleteMessage}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Message
            </button>
          ) : (
            <div className="px-4 py-2.5 text-white/40 text-sm">
              Cannot delete this message
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageContainer;
