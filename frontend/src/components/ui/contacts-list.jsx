import { getColor } from "@/pages/utils/index.jsx";
import {
  chatData,
  chatType,
  setSelectedChatData,
  setSelectedChatMessages,
  setSelectedChatType,
} from "@/store/chatSlice";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

function ContactList({ contacts, ischannel = false }) {
  const selectedChatType = useSelector(chatType);
  const selectedChatData = useSelector(chatData);
  const dispatch = useDispatch();

  const handleClick = ({ contact }) => {
    dispatch(setSelectedChatType(ischannel ? "channel" : "contact"));
    dispatch(setSelectedChatData(contact));

    if (selectedChatData.selectedChatData?._id !== contact.contactId?.[0]) {
      dispatch(setSelectedChatMessages([]));
    }
  };

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-4 text-white/30 text-sm px-4">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="px-3 space-y-1">
      {contacts.map((contact, index) => {
        const isActive =
          selectedChatData.selectedChatData?.contactId?.[0] ===
          contact.contactId?.[0];

        return (
          <button
            key={contact._id || index}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive
                ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 border border-violet-500/30"
                : "hover:bg-white/5 border border-transparent"
            }`}
            onClick={() => handleClick({ contact })}
          >
            {/* Avatar */}
            <Avatar className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
              {contact.image ? (
                <AvatarImage
                  src={contact.image}
                  alt="profile"
                  className="object-cover h-full w-full rounded-full"
                />
              ) : (
                <div
                  className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium uppercase border ${getColor(
                    contact.color
                  )}`}
                >
                  {contact.firstName ? contact.firstName[0] : contact.email[0]}
                </div>
              )}
            </Avatar>

            {/* Contact Info */}
            <div className="flex-1 min-w-0 text-left">
              <p
                className={`text-sm font-medium truncate transition-colors ${
                  isActive ? "text-white" : "text-white/80 group-hover:text-white"
                }`}
              >
                {contact.firstName && contact.lastName
                  ? `${contact.firstName} ${contact.lastName}`
                  : contact.firstName || contact.email}
              </p>
              {contact.firstName && (
                <p className="text-xs text-white/40 truncate">{contact.email}</p>
              )}
            </div>

            {/* Online indicator (placeholder) */}
            <div className="w-2 h-2 rounded-full bg-emerald-500/60 flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

export default ContactList;
