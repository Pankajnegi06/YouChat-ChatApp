import { Group } from "../models/group.model.js";
import { fileUpload } from "../utils/cloudinaryUpload.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
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

    res.status(201).json({ group });
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
    if (!group.members.some(id => id.toString() === userId)) group.members.push(userId);
    await group.save();
    res.status(200).json({ group });
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


