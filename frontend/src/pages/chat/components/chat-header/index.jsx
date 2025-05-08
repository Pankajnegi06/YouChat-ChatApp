import { useDispatch, useSelector } from "react-redux";
import { chatData, clearSelectedChat } from "@/store/chatSlice";
import { IoArrowBack } from "react-icons/io5";

const ChatHeader = () => {
    const dispatch = useDispatch();
    const { selectedChatData, selectedChatType } = useSelector(chatData);

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => dispatch(clearSelectedChat())}
                    className="p-2 rounded-full hover:bg-gray-700"
                >
                    <IoArrowBack className="text-xl" />
                </button>
                
                {selectedChatData && (
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: selectedChatData.color }}
                        >
                            {selectedChatData.image ? (
                                <img 
                                    src={selectedChatData.image} 
                                    alt="profile" 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                selectedChatData.firstName?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold">
                                {selectedChatType === "contact" && selectedChatData.firstName
                                    ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                                    : selectedChatData.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {selectedChatType === "contact" ? selectedChatData.email : ""}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
