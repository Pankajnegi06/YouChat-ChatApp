import { Schema, model } from "mongoose";

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true
  },
  messageType: {
    type: String,
    enum: ["text", "file"],
    required: true
  },
  content: {
    type: String,
    required: function () {
      return this.messageType === "text";
    }
  },
  fileUrl: {
    type: String,
    required: function () {
      return this.messageType === "file";
    }
  },
  embedding: {
    type: [Number],
    default: []
  },

}, { timestamps: true });

export const Message = model("Message", messageSchema);
