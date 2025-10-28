import { useDispatch, useSelector } from "react-redux";
import { chatData, clearSelectedChat } from "@/store/chatSlice";
import { IoArrowBack } from "react-icons/io5";

const ChatHeader = () => {
    const dispatch = useDispatch();
    const { selectedChatData, selectedChatType } = useSelector(chatData);

    return (
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 backdrop-blur-xl bg-[oklch(0.14_0.03_265_/0.6)] border-b border-white/10">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => dispatch(clearSelectedChat())}
                    className="p-2 rounded-full hover:bg-white/10 border border-white/10 transition-colors"
                >
                    <IoArrowBack className="text-xl" />
                </button>
                
                {selectedChatData && (
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5 flex items-center justify-center text-white"
                            style={{ backgroundColor: selectedChatData.color }}
                        >
                            {selectedChatData.image ? (
                                <img 
                                    src={selectedChatData.image} 
                                    alt="profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                selectedChatData.firstName?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold leading-none">
                                {selectedChatType === "contact" && selectedChatData.firstName
                                    ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                                    : selectedChatData.name}
                            </h3>
                            <p className="text-xs text-white/60">
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
