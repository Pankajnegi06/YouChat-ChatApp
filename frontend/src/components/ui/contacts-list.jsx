
import { getColor } from "@/pages/utils/index.jsx";
import {
  chatData,
  chatType,
  setSelectedChatData,
  setSelectedChatMessages,
  setSelectedChatType,
} from "@/store/chatSlice";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

function ContactList({ contacts, ischannel = false }) {
  const selectedChatType = useSelector(chatType);
  const selectedChatData = useSelector(chatData);
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedChatData) {
      console.log("Updated selectedChatData:", selectedChatData);
    }
  }, [selectedChatData]);
  

  const handleClick = ({ contact }) => {
    dispatch(setSelectedChatType(ischannel ? "channel" : "contact"));
    dispatch(setSelectedChatData(contact));
    
    if (

      selectedChatData.selectedChatData?._id !== contact.contacId?.[0]
    ) {
      dispatch(setSelectedChatMessages([]));
    }
  };

  return (
    <div className="mt-5">
      {contacts.map((contact, index) => {
        
        const isActive = selectedChatData.selectedChatData?.contactId?.[0] == contact.contactId?.[0]
        
        return (
          <div
            key={index}
            className={`pl-10 py-2 w-[95%] mx-auto rounded-lg ease-out transition-all duration-300 cursor-pointer mt-3 max-h-[calc(100vh-100px)] overflow-y-auto scroll-smooth snap-y snap-mandatory ${
              isActive
                ? "bg-[#8417ff] hover:bg-[#8417ff]"
                : "hover:bg-[#f1f1f111]"
            }`}
            onClick={() => handleClick({ contact })}
          >
            <div className="flex justify-start items-center gap-5 text-neutral-300  scrollbar-hidden">
              {!ischannel && (
                <Avatar className="h-10 w-10 rounded-full">
                  {contact.image ? (
                    <AvatarImage
                      src={contact.image}
                      alt="profile"
                      className="object-cover h-full w-full rounded-full bg-black"
                    />
                  ) : (
                    <div
                    className={`uppercase h-10 w-10 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(contact.color)}`}
                  >
                    
                    {contact.firstName ? contact.firstName[0] : contact.email[0]}
                  </div>
                  
                  )}
                </Avatar>
              )}
              <span className="tracking-widest text-neutral-400 pl-5 font-light text-opacity-90 text-lg">{contact.firstName || contact.email}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ContactList;
