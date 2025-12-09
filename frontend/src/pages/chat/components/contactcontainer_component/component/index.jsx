import React, { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FaPlus } from "react-icons/fa";
import Lottie from "react-lottie";
import { animationDefaultOptions, getColor } from "@/pages/utils";
import axios from "axios";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { useDispatch, useSelector } from "react-redux";
import {
  chatData,
  setDirectMessagesContacts,
  setSelectedChatData,
  setSelectedChatType,
} from "@/store/chatSlice";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { Button } from "@/components/ui/button";

function NewDm() {
  const dispatch = useDispatch();
  const [openNewContactModel, setOpenNewContactModel] = useState(false);
  const [searchContact, setSearchContact] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const handleSearchContacts = async (searchTerm) => {
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length === 0) {
      setSearchContact([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await axios.post(
        API_ENDPOINTS.contacts.searchContacts,
        { searchTerm: trimmedTerm },
        { withCredentials: true }
      );

      if (response.data?.Contacts?.length > 0) {
        setSearchContact(response.data.Contacts);
      } else {
        setSearchContact([]);
        setSearchError("No contacts found");
      }
    } catch (error) {
      console.error("Couldn't search contacts:", error);
      setSearchError("Failed to search contacts");
      setSearchContact([]);
    } finally {
      setIsSearching(false);
    }
  };


  const selectNewContact = (contact) => {
    setOpenNewContactModel(false);
    dispatch(setSelectedChatType("contact"));
    dispatch(setSelectedChatData(contact));
    setSearchContact([]);
  };

  const handleCloseDialog = () => {
    setOpenNewContactModel(false);
    setSearchContact([]);
    setSearchError(null);
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      setCreatingGroup(true);
      const res = await axios.post(API_ENDPOINTS.groups.create, { name: groupName }, { withCredentials: true });
      if (res.status === 201) {
        setOpenCreateGroup(false);
        setGroupName("");
      }
    } catch (e) {
      console.error("Create group failed", e);
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label="New direct message"
            className="p-2 rounded-full hover:bg-[#2a2b33] transition-colors"
            onClick={() => setOpenNewContactModel(true)}
          >
            <FaPlus className="text-neutral-400 hover:text-neutral-100 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
          <p>New direct message</p>
        </TooltipContent>
      </Tooltip>

      <div className="px-5 mt-2">
        <Button size="sm" variant="outline" className="w-full justify-center" onClick={() => setOpenCreateGroup(true)}>Create group</Button>
      </div>

      <Dialog open={openNewContactModel} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center">
              Select a contact to message
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Search by name or email
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col">
            <input
              className="rounded-xl p-3 bg-[#2c2e3b] border-none w-full mb-4 focus:ring-2 focus:ring-purple-500"
              placeholder="Search contacts..."
              onChange={(e) => handleSearchContacts(e.target.value)}
              aria-label="Search contacts"
            />

            {isSearching ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : searchError ? (
              <div className="flex-1 flex items-center justify-center text-red-400">
                {searchError}
              </div>
            ) : searchContact.length > 0 ? (
              <ScrollArea
                className="h-[250px] pr-2 py-0.5 overflow-y-auto 
              scrollbar-thin 
              scrollbar-thumb-gray-400/50 
              scrollbar-track-transparent"
              >
                <div className="flex flex-col gap-3">
                  {searchContact.map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => selectNewContact(contact)}
                      className="flex gap-3 items-center p-2 rounded-lg hover:bg-[#2a2b33] transition-colors w-full text-left"
                    >
                      <Avatar className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-neutral-600">
                        {contact.image ? (
                          <AvatarImage
                            src={contact.image}
                            alt={`${
                              contact.firstName || contact.email
                            }'s profile`}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <div
                            className={`h-full w-full flex items-center justify-center uppercase ${getColor(
                              contact.color
                            )}`}
                          >
                            {contact.firstName?.charAt(0) ||
                              contact.email.charAt(0)}
                          </div>
                        )}
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">
                          {contact.firstName && contact.lastName
                            ? `${contact.firstName} ${contact.lastName}`
                            : contact.email}
                        </span>
                        {contact.firstName && (
                          <span className="text-xs text-gray-400 truncate">
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Lottie
                  isClickToPauseDisabled
                  height={120}
                  width={120}
                  options={animationDefaultOptions}
                />
                <div className="text-center mt-4 text-gray-400">
                  <h3 className="text-lg">
                    Search for contacts to start a conversation
                  </h3>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {openCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[oklch(0.16_0.03_265_/0.7)] backdrop-blur-xl p-5 space-y-3">
            <div className="text-lg font-medium">Create group</div>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" className="w-full h-10 px-3 rounded-md bg-black/20 border border-white/10 outline-none focus:ring-2 focus:ring-white/20" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpenCreateGroup(false)} className="px-3 py-1.5 rounded-md bg-white/10">Cancel</button>
              <button disabled={creatingGroup} onClick={createGroup} className="px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 text-white disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}

export default NewDm;
