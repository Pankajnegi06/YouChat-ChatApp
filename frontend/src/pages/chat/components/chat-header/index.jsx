import { useDispatch, useSelector } from "react-redux";
import { chatData, clearSelectedChat } from "@/store/chatSlice";
import { IoArrowBack } from "react-icons/io5";
import { getColor } from "@/pages/utils";
import { Users } from "lucide-react";

const ChatHeader = () => {
    const dispatch = useDispatch();
    const { selectedChatData, selectedChatType } = useSelector(chatData);

    // Get image URL - try multiple possible fields
    const getImageUrl = () => {
        if (!selectedChatData) return null;
        // For groups
        if (selectedChatType === "channel") {
            return selectedChatData.avatar || null;
        }
        // For contacts - try different field names
        return selectedChatData.image || selectedChatData.profileImage || selectedChatData.avatar || null;
    };

    const imageUrl = getImageUrl();

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
                            className={`w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 flex items-center justify-center text-white ${
                                !imageUrl ? (selectedChatData.color ? '' : 'bg-gradient-to-br from-violet-600/50 to-fuchsia-600/50') : ''
                            } ${getColor(selectedChatData.color) || ''}`}
                        >
                            {imageUrl ? (
                                <img 
                                    src={imageUrl} 
                                    alt="profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : selectedChatType === "channel" ? (
                                <Users className="w-5 h-5 text-violet-300" />
                            ) : (
                                <span className="font-semibold">
                                    {selectedChatData.firstName?.[0]?.toUpperCase() || selectedChatData.name?.[0]?.toUpperCase() || '?'}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold leading-none">
                                {selectedChatType === "contact" && selectedChatData.firstName
                                    ? `${selectedChatData.firstName} ${selectedChatData.lastName || ''}`
                                    : selectedChatData.name || selectedChatData.email}
                            </h3>
                            <p className="text-xs text-white/60">
                                {selectedChatType === "contact" 
                                    ? selectedChatData.email 
                                    : `${selectedChatData.members?.length || 0} members`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
