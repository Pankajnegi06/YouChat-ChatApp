import React, { useState, useRef } from "react";
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
import { Plus, Search, Users, X, UserPlus, Camera } from "lucide-react";
import Lottie from "react-lottie";
import { animationDefaultOptions, getColor } from "@/pages/utils";
import axios from "axios";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { useDispatch } from "react-redux";
import {
  setSelectedChatData,
  setSelectedChatType,
} from "@/store/chatSlice";
import { API_ENDPOINTS } from "@/lib/apiConfig";

function NewDm({ onGroupCreated }) {
  const dispatch = useDispatch();
  const [openNewContactModel, setOpenNewContactModel] = useState(false);
  const [searchContact, setSearchContact] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // For member selection
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  
  // For group image
  const [groupImage, setGroupImage] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState(null);
  const imageInputRef = useRef(null);

  const handleSearchContacts = async (term) => {
    setSearchTerm(term);
    const trimmedTerm = term.trim();
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

  const handleSearchMembers = async (term) => {
    setMemberSearchTerm(term);
    const trimmedTerm = term.trim();
    if (trimmedTerm.length === 0) {
      setMemberSearchResults([]);
      return;
    }

    setIsSearchingMembers(true);

    try {
      const response = await axios.post(
        API_ENDPOINTS.contacts.searchContacts,
        { searchTerm: trimmedTerm },
        { withCredentials: true }
      );

      if (response.data?.Contacts?.length > 0) {
        const filtered = response.data.Contacts.filter(
          c => !selectedMembers.some(m => m._id === c._id)
        );
        setMemberSearchResults(filtered);
      } else {
        setMemberSearchResults([]);
      }
    } catch (error) {
      console.error("Couldn't search members:", error);
      setMemberSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const toggleMemberSelection = (contact) => {
    const isSelected = selectedMembers.some(m => m._id === contact._id);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(m => m._id !== contact._id));
    } else {
      setSelectedMembers([...selectedMembers, contact]);
    }
    setMemberSearchResults(memberSearchResults.filter(c => c._id !== contact._id));
    setMemberSearchTerm("");
  };

  const removeMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== memberId));
  };

  const selectNewContact = (contact) => {
    setOpenNewContactModel(false);
    dispatch(setSelectedChatType("contact"));
    dispatch(setSelectedChatData(contact));
    setSearchContact([]);
    setSearchTerm("");
  };

  const handleCloseDialog = () => {
    setOpenNewContactModel(false);
    setSearchContact([]);
    setSearchError(null);
    setSearchTerm("");
  };

  const handleCloseGroupModal = () => {
    setOpenCreateGroup(false);
    setGroupName("");
    setSelectedMembers([]);
    setMemberSearchTerm("");
    setMemberSearchResults([]);
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      setCreatingGroup(true);
      
      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('members', JSON.stringify(selectedMembers.map(m => m._id)));
      if (groupImage) {
        formData.append('image', groupImage);
      }
      
      const res = await axios.post(
        API_ENDPOINTS.groups.create,
        formData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      if (res.status === 201) {
        handleCloseGroupModal();
        onGroupCreated?.();
      }
    } catch (e) {
      console.error("Create group failed", e);
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* New DM Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="New direct message"
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setOpenNewContactModel(true)}
              >
                <Plus className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none p-2 text-white text-xs">
              New conversation
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Create Group Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Create group"
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setOpenCreateGroup(true)}
              >
                <Users className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none p-2 text-white text-xs">
              Create group
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search Contacts Dialog */}
      <Dialog open={openNewContactModel} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-[#12121a] border border-white/10 text-white w-[420px] max-h-[500px] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              New Conversation
            </DialogTitle>
            <DialogDescription className="text-center text-white/50 text-sm">
              Search for someone to start chatting
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearchContacts(e.target.value)}
              />
            </div>

            <div className="mt-4 flex-1 min-h-[200px]">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : searchError ? (
                <div className="flex items-center justify-center py-8 text-white/40 text-sm">
                  {searchError}
                </div>
              ) : searchContact.length > 0 ? (
                <ScrollArea className="max-h-[250px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {searchContact.map((contact) => (
                      <button
                        key={contact._id}
                        onClick={() => selectNewContact(contact)}
                        className="flex gap-3 items-center p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all w-full text-left group"
                      >
                        <Avatar className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                          {contact.image ? (
                            <AvatarImage
                              src={contact.image}
                              alt="profile"
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <div
                              className={`h-full w-full flex items-center justify-center uppercase text-sm font-medium ${getColor(contact.color)}`}
                            >
                              {contact.firstName?.charAt(0) || contact.email.charAt(0)}
                            </div>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white/90 group-hover:text-white truncate">
                            {contact.firstName && contact.lastName
                              ? `${contact.firstName} ${contact.lastName}`
                              : contact.email}
                          </p>
                          {contact.firstName && (
                            <p className="text-xs text-white/40 truncate">{contact.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : searchTerm ? (
                <div className="flex items-center justify-center py-8 text-white/40 text-sm">
                  No results for "{searchTerm}"
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Lottie isClickToPauseDisabled height={100} width={100} options={animationDefaultOptions} />
                  <p className="text-white/40 text-sm mt-2">Type to search for contacts</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Modal */}
      {openCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Create Group</h3>
              <button onClick={handleCloseGroupModal} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Group Image */}
              <div className="flex justify-center">
                <div className="relative">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border-2 border-dashed border-violet-500/30 flex items-center justify-center overflow-hidden hover:border-violet-500/50 transition-all"
                  >
                    {groupImagePreview ? (
                      <img src={groupImagePreview} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-violet-400" />
                    )}
                  </button>
                  {groupImagePreview && (
                    <button
                      onClick={() => { setGroupImage(null); setGroupImagePreview(null); }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-center text-xs text-white/40">Click to add group photo</p>

              {/* Group Name */}
              <div>
                <label className="text-sm text-white/50 mb-2 block">Group Name</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              {/* Add Members */}
              <div>
                <label className="text-sm text-white/50 mb-2 block flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Members
                </label>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    value={memberSearchTerm}
                    onChange={(e) => handleSearchMembers(e.target.value)}
                    placeholder="Search people to add..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                  />
                </div>

                {memberSearchTerm && (
                  <div className="mt-2 max-h-[150px] overflow-y-auto rounded-xl border border-white/10 bg-white/5">
                    {isSearchingMembers ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                      </div>
                    ) : memberSearchResults.length > 0 ? (
                      memberSearchResults.map((contact) => (
                        <button
                          key={contact._id}
                          onClick={() => toggleMemberSelection(contact)}
                          className="flex gap-3 items-center p-3 hover:bg-white/5 transition-all w-full text-left"
                        >
                          <Avatar className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center">
                            {contact.image ? (
                              <AvatarImage src={contact.image} alt="profile" className="object-cover h-full w-full" />
                            ) : (
                              <div className={`h-full w-full flex items-center justify-center uppercase text-xs font-medium ${getColor(contact.color)}`}>
                                {contact.firstName?.charAt(0) || contact.email.charAt(0)}
                              </div>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 truncate">
                              {contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.email}
                            </p>
                          </div>
                          <Plus className="w-4 h-4 text-violet-400" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-white/40 text-sm">No users found</div>
                    )}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-white/40 mb-2">
                      {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/30"
                        >
                          <span className="text-sm text-violet-200">
                            {member.firstName || member.email.split('@')[0]}
                          </span>
                          <button
                            onClick={() => removeMember(member._id)}
                            className="p-0.5 rounded-full hover:bg-white/10"
                          >
                            <X className="w-3 h-3 text-violet-300" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-white/5">
              <button
                onClick={handleCloseGroupModal}
                className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={creatingGroup || !groupName.trim()}
                onClick={createGroup}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 text-white font-medium hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {creatingGroup ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NewDm;
