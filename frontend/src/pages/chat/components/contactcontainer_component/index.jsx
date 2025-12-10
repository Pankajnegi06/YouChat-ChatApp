import ProfileInfo from "@/pages/profile/component/profile-info";
import React, { useEffect, useState } from "react";
import NewDm from "./component";
import { useDispatch, useSelector } from "react-redux";
import { DirectMessages, setDirectMessagesContacts, setSelectedChatData, setSelectedChatType, setSelectedChatMessages, clearSelectedChat } from "@/store/chatSlice";
import ContactList from "@/components/ui/contacts-list";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { Users, MessageSquare, Hash, ChevronDown, ChevronRight, Trash2, LogOut, MoreVertical, X, UserPlus, Search } from "lucide-react";
import { selectUser } from "@/store/userSlice";
import { useSocket } from "@/socketContext";
import { getColor } from "@/pages/utils";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";

function ContactContainer() {
  const dispatch = useDispatch();
  const userInfo = useSelector(selectUser);
  const DirectMessagesContacts = useSelector(DirectMessages);
  const { socket } = useSocket();
  const [groups, setGroups] = useState([]);
  const [dmExpanded, setDmExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [groupMenu, setGroupMenu] = useState({ show: false, groupId: null, isAdmin: false, x: 0, y: 0 });
  
  // Add Members Modal State
  const [addMembersModal, setAddMembersModal] = useState({ show: false, groupId: null });
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.groups.list, { withCredentials: true });
      if (response.data.groups) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  useEffect(() => {
    const getContacts = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.contacts.getContactList,
          { withCredentials: true }
        );

        if (response.data.contacts) {
          dispatch(setDirectMessagesContacts(response.data.contacts));
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };

    getContacts();
    fetchGroups();
  }, [dispatch]);

  // Listen for new group created events
  useEffect(() => {
    if (!socket) return;

    const handleNewGroup = (newGroup) => {
      console.log('New group received via socket:', newGroup);
      setGroups(prev => {
        // Check if group already exists
        if (prev.some(g => g._id === newGroup._id)) {
          return prev;
        }
        return [...prev, newGroup];
      });
    };

    const handleGroupUpdated = (updatedGroup) => {
      console.log('Group updated via socket:', updatedGroup);
      setGroups(prev => prev.map(g => 
        g._id === updatedGroup._id ? updatedGroup : g
      ));
    };

    socket.on("newGroupCreated", handleNewGroup);
    socket.on("groupUpdated", handleGroupUpdated);

    return () => {
      socket.off("newGroupCreated", handleNewGroup);
      socket.off("groupUpdated", handleGroupUpdated);
    };
  }, [socket]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setGroupMenu({ show: false, groupId: null, isAdmin: false, x: 0, y: 0 });
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSelectGroup = (group) => {
    console.log('=== SELECTING GROUP ===', group.name, group._id);
    dispatch(setSelectedChatType("channel"));
    dispatch(setSelectedChatData(group));
    dispatch(setSelectedChatMessages([]));
  };

  const handleGroupMenu = (e, group) => {
    e.stopPropagation();
    const isAdmin = group.admins?.some(id => 
      (typeof id === 'object' ? id._id : id) === userInfo._id
    );
    setGroupMenu({
      show: true,
      groupId: group._id,
      isAdmin,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleDeleteGroup = async () => {
    if (!groupMenu.groupId) return;
    try {
      await axios.post(API_ENDPOINTS.groups.delete, { groupId: groupMenu.groupId }, { withCredentials: true });
      setGroups(groups.filter(g => g._id !== groupMenu.groupId));
      dispatch(clearSelectedChat());
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
    setGroupMenu({ show: false, groupId: null, isAdmin: false, x: 0, y: 0 });
  };

  const handleLeaveGroup = async () => {
    if (!groupMenu.groupId) return;
    try {
      await axios.post(API_ENDPOINTS.groups.leave, { groupId: groupMenu.groupId }, { withCredentials: true });
      setGroups(groups.filter(g => g._id !== groupMenu.groupId));
      dispatch(clearSelectedChat());
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
    setGroupMenu({ show: false, groupId: null, isAdmin: false, x: 0, y: 0 });
  };

  const handleOpenAddMembers = () => {
    setAddMembersModal({ show: true, groupId: groupMenu.groupId });
    setGroupMenu({ show: false, groupId: null, isAdmin: false, x: 0, y: 0 });
  };

  const handleSearchMembers = async (term) => {
    setMemberSearchTerm(term);
    if (term.trim().length === 0) {
      setMemberSearchResults([]);
      return;
    }
    setIsSearchingMembers(true);
    try {
      const response = await axios.post(
        API_ENDPOINTS.contacts.searchContacts,
        { searchTerm: term.trim() },
        { withCredentials: true }
      );
      if (response.data?.Contacts?.length > 0) {
        // Get current group members to filter them out
        const currentGroup = groups.find(g => g._id === addMembersModal.groupId);
        const currentMemberIds = currentGroup?.members?.map(m => 
          typeof m === 'object' ? m._id : m
        ) || [];
        
        const filtered = response.data.Contacts.filter(c => !currentMemberIds.includes(c._id));
        setMemberSearchResults(filtered);
      } else {
        setMemberSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setMemberSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const handleAddMember = async (userId) => {
    if (!addMembersModal.groupId) return;
    setAddingMember(true);
    try {
      await axios.post(
        API_ENDPOINTS.groups.addMember,
        { groupId: addMembersModal.groupId, userId },
        { withCredentials: true }
      );
      // Refresh groups to get updated member list
      fetchGroups();
      setMemberSearchResults(prev => prev.filter(m => m._id !== userId));
      setMemberSearchTerm("");
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setAddingMember(false);
    }
  };

  const closeAddMembersModal = () => {
    setAddMembersModal({ show: false, groupId: null });
    setMemberSearchTerm("");
    setMemberSearchResults([]);
  };

  return (
    <div className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] border-r border-white/10 w-full bg-[#0c0c14] flex flex-col h-screen">
      {/* Logo */}
      <div className="pt-4 pb-2 border-b border-white/5">
        <Logo />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {/* Direct Messages Section */}
        <div className="py-3">
          <SectionHeader 
            title="Direct Messages" 
            icon={<MessageSquare className="w-4 h-4" />}
            expanded={dmExpanded}
            onToggle={() => setDmExpanded(!dmExpanded)}
          >
            <NewDm onGroupCreated={fetchGroups} />
          </SectionHeader>
          
          {dmExpanded && (
            <div className="mt-2">
              <ContactList contacts={DirectMessagesContacts} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Groups/Channels Section */}
        <div className="py-3">
          <SectionHeader 
            title="Groups" 
            icon={<Users className="w-4 h-4" />}
            expanded={groupsExpanded}
            onToggle={() => setGroupsExpanded(!groupsExpanded)}
          />
          
          {groupsExpanded && (
            <div className="mt-2 px-3">
              {groups.length === 0 ? (
                <div className="text-center py-4 text-white/30 text-sm">
                  No groups yet
                </div>
              ) : (
                groups.map((group) => (
                  <GroupItem 
                    key={group._id} 
                    group={group} 
                    onClick={() => handleSelectGroup(group)}
                    onMenuClick={(e) => handleGroupMenu(e, group)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Info - Fixed at bottom */}
      <div className="border-t border-white/5">
        <ProfileInfo />
      </div>

      {/* Group Context Menu */}
      {groupMenu.show && (
        <div 
          className="fixed z-50 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
          style={{ left: groupMenu.x, top: groupMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleOpenAddMembers}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-violet-400 hover:bg-violet-500/10 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Members
          </button>
          {groupMenu.isAdmin && (
            <button
              onClick={handleDeleteGroup}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Group
            </button>
          )}
          <button
            onClick={handleLeaveGroup}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-orange-400 hover:bg-orange-500/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Leave Group
          </button>
        </div>
      )}

      {/* Add Members Modal */}
      {addMembersModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-400" />
                Add Members
              </h3>
              <button onClick={closeAddMembersModal} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={memberSearchTerm}
                  onChange={(e) => handleSearchMembers(e.target.value)}
                  placeholder="Search people to add..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                />
              </div>

              {isSearchingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : memberSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {memberSearchResults.map((contact) => (
                    <div
                      key={contact._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <Avatar className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                        {contact.image ? (
                          <AvatarImage src={contact.image} alt="profile" className="object-cover h-full w-full" />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center uppercase text-sm font-medium ${getColor(contact.color)}`}>
                            {contact.firstName?.charAt(0) || contact.email.charAt(0)}
                          </div>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">
                          {contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.email}
                        </p>
                        <p className="text-xs text-white/40 truncate">{contact.email}</p>
                      </div>
                      <button
                        onClick={() => handleAddMember(contact._id)}
                        disabled={addingMember}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                      >
                        {addingMember ? "Adding..." : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : memberSearchTerm ? (
                <div className="text-center py-4 text-white/40 text-sm">No users found</div>
              ) : (
                <div className="text-center py-4 text-white/40 text-sm">Search for people to add to this group</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
              <button
                onClick={closeAddMembersModal}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactContainer;

// Section Header Component
const SectionHeader = ({ title, icon, expanded, onToggle, children }) => (
  <div className="flex items-center justify-between px-4 py-1">
    <button 
      onClick={onToggle}
      className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
    >
      {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
    </button>
    {children}
  </div>
);

// Group Item Component
const GroupItem = ({ group, onClick, onMenuClick }) => (
  <div
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
  >
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/20 flex items-center justify-center overflow-hidden">
      {group.avatar ? (
        <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
      ) : (
        <Hash className="w-4 h-4 text-violet-400" />
      )}
    </div>
    <div className="flex-1 text-left min-w-0">
      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate block">
        {group.name}
      </span>
      <p className="text-xs text-white/40">
        {group.members?.length || 0} members
      </p>
    </div>
    <button
      onClick={onMenuClick}
      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
    >
      <MoreVertical className="w-4 h-4 text-white/50" />
    </button>
  </div>
);

// Logo Component
const Logo = () => {
  return (
    <div className="flex px-5 justify-start items-center gap-2">
      <svg
        id="logo-38"
        width="78"
        height="32"
        viewBox="0 0 78 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
          className="ccustom"
          fill="#8338ec"
        />
        <path
          d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
          className="ccompli1"
          fill="#975aed"
        />
        <path
          d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
          className="ccompli2"
          fill="#a16ee8"
        />
      </svg>
      <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
        YouChat
      </span>
    </div>
  );
};

export { Logo };

export const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
