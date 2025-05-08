import { addNewMessage, chatData, chatMessages } from "@/store/chatSlice";
import { selectUser } from "@/store/userSlice";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { IoConstructOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

const socketContext = createContext(null);

export const useSocket = () => {
    return useContext(socketContext);
};

export const SocketProvider = ({ children }) => {
    
    const socket = useRef();
    const userInfo = useSelector(selectUser);
    const MessageArray = useSelector(chatMessages);
    const messageArrayRef = useRef(MessageArray);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const dispatch = useDispatch();
    
    
    // Correctly fetch state using useSelector
    const { selectedChatData, selectedChatType } = useSelector(chatData);

    // Stable message handler with proper dependencies
    const handleReceiveMessage = useCallback((message) => {
        try {
            console.log(message)
              
           
            if (!message.sender || !message.receiver[0] || !message.content) {
                console.error('Message missing required fields:', message);
                return;
            }
            
            const isRelevant = selectedChatData?.contactId && (
                selectedChatData.contactId == message?.sender?._id || 
                selectedChatData.contactId == message?.receiver?.[0]?._id
            );
            
            
            if (selectedChatType !== undefined && isRelevant) {
                console.log('Processing message for current chat:', message.content);
                dispatch(addNewMessage(message));
                
               
            } else {
                console.log('Message received but not for current chat:', message);
            }
        } catch (error) {
            console.error('Error processing message:', error, message);
        }
    }, [dispatch, selectedChatData, selectedChatType]); 

    
    useEffect(()=>{
        messageArrayRef.current = MessageArray;
    },[MessageArray])

    useEffect(() => {
        if (!userInfo?._id) {
            console.log('No user ID available for socket connection');
            return;
        }

        // Initialize socket connection
        const initializeSocket = () => {

            console.log('Initializing socket connection for user:', userInfo._id);
            setConnectionError(null);

            socket.current = io("http://localhost:8000", { 
                withCredentials: true,
                query: { userId: userInfo._id },
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000
            });

            // Connection handlers
            socket.current.on("connect", () => {
                console.log("Successfully connected to socket server");
                setIsConnected(true);
                setConnectionError(null);
            });

            socket.current.on("disconnect", (reason) => {
                console.log("Disconnected from socket server. Reason:", reason);
                setIsConnected(false);
                if (reason === "io server disconnect") {
                    setConnectionError("Server disconnected. Please refresh.");
                }
            });

            socket.current.on("connect_error", (err) => {
                console.error("Socket connection error:", err.message);
                setConnectionError(err.message);
                setIsConnected(false);
            });

            socket.current.on("reconnect_attempt", (attempt) => {
                console.log(`Reconnect attempt ${attempt}`);
            });

            socket.current.on("reconnect_failed", () => {
                console.error("Reconnect failed");
                setConnectionError("Unable to reconnect. Please refresh the page.");
            });

            // Message handler
            socket.current.on("receiveMessages", handleReceiveMessage);
        };

        initializeSocket();

        // Cleanup function
        return () => {
            console.log('Cleaning up socket connection');
            if (socket.current) {
                socket.current.off("receiveMessages", handleReceiveMessage);
                socket.current.off("connect");
                socket.current.off("disconnect");
                socket.current.off("connect_error");
                socket.current.disconnect();
                setIsConnected(false);
            }
        };
    }, [userInfo?._id, handleReceiveMessage]); // Added handleReceiveMessage to dependencies
    
    const value = {
        socket: socket.current,
       
        isConnected,
        connectionError,
        checkConnection: () => socket.current?.connected || false,
        reconnect: () => {
            if (socket.current && !socket.current.connected) {
                socket.current.connect();
            }
        }
    };

    return (
        <socketContext.Provider value={value}>
            {children}
        </socketContext.Provider>
    );
};