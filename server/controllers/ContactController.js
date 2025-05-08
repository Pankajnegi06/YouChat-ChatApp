import { User } from "../models/user.model.js";

export const SearchContacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ msg: "searchTerm is not provided" });
    }

    const sanitizedSearchTerm = searchTerm.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    const regex = new RegExp(sanitizedSearchTerm, "i");

    const Contacts = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { firstName: regex },
            { lastName: regex },
            { email: regex }
          ]
        }
      ]
    }).select("-password -refreshToken");
    
    

    return res.status(200).json({ msg: "Successfully searched the contacts", Contacts });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ msg: "Couldn't search the contact" });
  }
};

