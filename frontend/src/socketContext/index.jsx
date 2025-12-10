import { selectUser } from "@/store/userSlice";
import { addContactToDMs } from "@/store/chatSlice";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { getSocketConfig } from "@/lib/apiConfig";

const socketContext = createContext(null);

export const useSocket = () => {
    return useContext(socketContext);
};

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const userInfo = useSelector(selectUser);
    const dispatch = useDispatch();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    // Use state to track socket instance so context updates when socket is ready
    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        if (!userInfo?._id) {
            console.log('No user ID available for socket connection');
            return;
        }

        // Only initialize if not already connected
        if (socketRef.current?.connected) {
            console.log('Socket already connected');
            return;
        }

        console.log('Initializing socket connection for user:', userInfo._id);
        setConnectionError(null);

        const socketConfig = getSocketConfig();
        const newSocket = io(socketConfig.url, { 
            ...socketConfig.options,
            query: { userId: userInfo._id },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        socketRef.current = newSocket;
        setSocketInstance(newSocket); // This triggers re-render so context updates

        // Connection handlers
        newSocket.on("connect", () => {
            console.log("Successfully connected to socket server");
            setIsConnected(true);
            setConnectionError(null);
        });

        newSocket.on("disconnect", (reason) => {
            console.log("Disconnected from socket server. Reason:", reason);
            setIsConnected(false);
            if (reason === "io server disconnect") {
                setConnectionError("Server disconnected. Please refresh.");
            }
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
            setConnectionError(err.message);
            setIsConnected(false);
        });

        newSocket.on("reconnect_attempt", (attempt) => {
            console.log(`Reconnect attempt ${attempt}`);
        });

        newSocket.on("reconnect_failed", () => {
            console.error("Reconnect failed");
            setConnectionError("Unable to reconnect. Please refresh the page.");
        });

        // Global listener for auto-adding contacts when receiving messages
        newSocket.on("receiveMessages", (message) => {
            // Extract sender info
            const sender = message.sender;
            const senderId = typeof sender === 'object' ? sender?._id : sender;
            
            // Check if user is the receiver (not the sender)
            const receiverIds = Array.isArray(message.receiver) 
                ? message.receiver.map(r => typeof r === 'object' ? r?._id : r)
                : [];
            const amIReceiver = receiverIds.includes(userInfo._id);
            
            // If I received a message and sender has full info, add to DMs
            if (amIReceiver && senderId !== userInfo._id && typeof sender === 'object') {
                console.log('Auto-adding sender to DMs:', sender);
                dispatch(addContactToDMs({
                    // contactId must be an array to match backend format
                    contactId: [sender._id],
                    _id: sender._id,
                    firstName: sender.firstName || '',
                    lastName: sender.lastName || '',
                    email: sender.email || '',
                    image: sender.image || '',
                    color: sender.color || 0
                }));
            }
        });

        // Cleanup function
        return () => {
            console.log('Cleaning up socket connection');
            if (socketRef.current) {
                socketRef.current.off("connect");
                socketRef.current.off("disconnect");
                socketRef.current.off("connect_error");
                socketRef.current.off("reconnect_attempt");
                socketRef.current.off("reconnect_failed");
                socketRef.current.off("receiveMessages");
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocketInstance(null);
                setIsConnected(false);
            }
        };
    }, [userInfo?._id, dispatch]);
    
    const value = {
        socket: socketInstance, // Now uses state, so context updates when socket is ready
        isConnected,
        connectionError,
        checkConnection: () => socketRef.current?.connected || false,
        reconnect: () => {
            if (socketRef.current && !socketRef.current.connected) {
                socketRef.current.connect();
            }
        }
    };

    return (
        <socketContext.Provider value={value}>
            {children}
        </socketContext.Provider>
    );
};
