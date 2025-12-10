import { Group } from "../models/group.model.js";
import { fileUpload } from "../utils/cloudinaryUpload.js";
import { getIo, userSocketMap } from "../socket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Members can come as JSON string from FormData or as array
    let members = req.body.members || [];
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch {
        members = [];
      }
    }
    
    if (!name) return res.status(400).json({ msg: "Group name is required" });

    const creatorId = req.user._id;
    const uniqueMembers = Array.from(new Set([creatorId.toString(), ...members]));

    let avatarUrl = "";
    if (req.file?.path) {
      avatarUrl = await fileUpload(req.file.path);
    }

    const group = await Group.create({
      name,
      description: description || "",
      avatar: avatarUrl,
      admins: [creatorId],
      members: uniqueMembers,
    });

    // Populate the group with member details for the socket event
    const populatedGroup = await Group.findById(group._id)
      .populate("members", "firstName lastName image email color");

    // Emit to all group members (except creator who already has it)
    const io = getIo();
    if (io) {
      for (const memberId of uniqueMembers) {
        if (memberId !== creatorId.toString()) {
          const memberSocketId = userSocketMap.get(memberId);
          if (memberSocketId) {
            console.log('Emitting newGroupCreated to member:', memberId);
            io.to(memberSocketId).emit("newGroupCreated", populatedGroup);
          }
        }
      }
    }

    res.status(201).json({ group: populatedGroup });
  } catch (err) {
    console.error("createGroup error", err);
    res.status(500).json({ msg: "Failed to create group" });
  }
};

export const listGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId }).populate("members", "firstName lastName image email color");
    res.status(200).json({ groups });
  } catch (err) {
    console.error("listGroups error", err);
    res.status(500).json({ msg: "Failed to list groups" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });
    if (!group.admins.some(id => id.toString() === req.user._id.toString())) return res.status(403).json({ msg: "Not authorized" });
    
    const wasAlreadyMember = group.members.some(id => id.toString() === userId);
    if (!wasAlreadyMember) {
      group.members.push(userId);
      await group.save();
    }
    
    // Populate and emit updated group to all members
    const populatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName image email color");
    
    const io = getIo();
    if (io && !wasAlreadyMember) {
      // Emit to new member that they were added to a group
      const newMemberSocketId = userSocketMap.get(userId);
      if (newMemberSocketId) {
        console.log('Emitting newGroupCreated to new member:', userId);
        io.to(newMemberSocketId).emit("newGroupCreated", populatedGroup);
      }
      
      // Emit updated group to all existing members
      for (const member of group.members) {
        const memberId = member.toString();
        if (memberId !== userId) {
          const memberSocketId = userSocketMap.get(memberId);
          if (memberSocketId) {
            console.log('Emitting groupUpdated to member:', memberId);
            io.to(memberSocketId).emit("groupUpdated", populatedGroup);
          }
        }
      }
    }
    
    res.status(200).json({ group: populatedGroup });
  } catch (err) {
    console.error("addMember error", err);
    res.status(500).json({ msg: "Failed to add member" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });
    if (!group.admins.some(id => id.toString() === req.user._id.toString())) return res.status(403).json({ msg: "Not authorized" });
    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();
    res.status(200).json({ group });
  } catch (err) {
    console.error("removeMember error", err);
    res.status(500).json({ msg: "Failed to remove member" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user._id;

    if (!groupId) {
      return res.status(400).json({ msg: "Group ID is required" });
    }

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Only admins can delete the group
    if (!group.admins.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({ msg: "Only group admins can delete the group" });
    }

    await Group.findByIdAndDelete(groupId);
    
    res.status(200).json({ msg: "Group deleted successfully", groupId });
  } catch (err) {
    console.error("deleteGroup error", err);
    res.status(500).json({ msg: "Failed to delete group" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // Store remaining members before removing
    const remainingMembers = group.members.filter(id => id.toString() !== userId.toString());

    // Remove user from members
    group.members = remainingMembers;
    
    // If user is an admin, remove from admins
    group.admins = group.admins.filter(id => id.toString() !== userId.toString());
    
    // If no admins left, make the first member an admin
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0]);
    }

    // If no members left, delete the group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ msg: "Group deleted (no members left)", groupId, deleted: true });
    }

    await group.save();
    
    // Populate and emit updated group to remaining members
    const populatedGroup = await Group.findById(groupId)
      .populate("members", "firstName lastName image email color");
    
    const io = getIo();
    if (io) {
      for (const member of remainingMembers) {
        const memberId = member.toString();
        const memberSocketId = userSocketMap.get(memberId);
        if (memberSocketId) {
          console.log('Emitting groupUpdated to member:', memberId);
          io.to(memberSocketId).emit("groupUpdated", populatedGroup);
        }
      }
    }
    
    res.status(200).json({ msg: "Left group successfully", groupId });
  } catch (err) {
    console.error("leaveGroup error", err);
    res.status(500).json({ msg: "Failed to leave group" });
  }
};
