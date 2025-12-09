import { Schema, model } from "mongoose";

const groupSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  avatar: { type: String, default: "" },
  admins: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
}, { timestamps: true });

export const Group = model("Group", groupSchema);


