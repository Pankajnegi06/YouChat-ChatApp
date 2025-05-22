import mongoose from "mongoose";
import { fileUpload } from "../config/cloudinary.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { Message } from "../models/message.model.js";

export const SignUp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "All input fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Handle file upload
    let imageUrl = "";
    if (req.file) {
      imageUrl = await fileUpload(req.file.path);
    }

    // Create new user instance
    const user = new User({ email, password: hashedPassword, image: imageUrl });

    // Generate tokens
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Fetch user details without password and refreshToken
    const newUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // Set cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use secure in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        msg: "User has been successfully created",
        newUser,
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "Cannot create user, an error has occurred" });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Find user and exclude refreshToken from the query
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
 
      return res.status(404).json({ msg: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(passwordMatch)
      return res.status(400).json({ msg: "Incorrect password" });
    }

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save();

    // Create a user object without sensitive data
    const userWithoutSensitiveData = await User.findById(user._id)
      .select("-password -refreshToken")
      .lean();

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use secure in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json({
        msg: "Successfully Logged In",
        user: userWithoutSensitiveData,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Couldn't log in user" });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      msg: "User details fetched successfully",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        color: user.color,
        image: user.image,
        profileSetup: user.profileSetup,
        _id: user._id,
        email: user.email, // if needed
      },
    });
  } catch (error) {
    console.error("Error in getUserInfo:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching user details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const ProfileSetup = async (req, res) => {
  try {
    const { color, firstName, lastName } = req.body;
    console.log(req.body);
    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ msg: "First name and last name are required." });
    }

    const decodedUser = req.user;
    const user = await User.findById(decodedUser._id);
    user.firstName = firstName;
    user.lastName = lastName;

    if (color) {
      user.color = color;
    } else if (req.file?.path) {
      const imageUrl = await fileUpload(req.file.path);
      user.image = imageUrl;
    }

    user.profileSetup = true;

    await user.save(); // Assuming Mongoose or similar ORM

    console.log("User setup:", user);

    res.status(200).json({ msg: "Successfully set up profile." });
  } catch (error) {
    console.error("Profile setup error:", error);
    res.status(500).json({ msg: "Couldn't set up user profile." });
  }
};

export const logout = async (req, res) => {
  try {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    };
    
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);
    
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(400).json({msg: "Couldn't logout user."})
  }
}

export const token = async (req,res) => {
  try {
    const {refreshToken} = req.body;
  
    if(!jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)){
        return res.status(400).json({msg:"couldnt reset accessToken"})
    }
    const accessToken = User.generateAccessToken()
    res.status(200).json({msg:"Successfully reset the accessToken"})
  } catch (error) {
    res.status(400).json({"An Error has occured while reseting accessToken":error})
  }
}

export const getContactsDmList = async (req, res) => {
  try {
    
    let userId = req.user._id;
    console.log(userId)
    userId = new mongoose.Types.ObjectId(userId);

    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ],
          $expr: { $ne: ["$sender", "$receiver"] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$sender", "$receiver"] },
              { sender: "$receiver", receiver: "$sender" },
              { sender: "$sender", receiver: "$receiver" }
            ]
          },
          lastTimeMessage: { $first: "$createdAt" },
          lastMessage: { $first: "$message" }
        }
      },
      {
        $project: {
          _id: 1,
          lastTimeMessage: 1,
          lastMessage: 1,
          contactId: {
            $cond: [
              { $eq: ["$_id.sender", userId] },
              "$_id.receiver",
              "$_id.sender"
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "contactId",
          foreignField: "_id",
          as: "contactInfo"
        }
      },
      {
        $unwind: "$contactInfo"
      },
      // 🔥 Add this stage to ensure only other users are included
      {
        $match: {
          contactId: { $ne: userId }
        }
      },
      {
        $project: {
          _id: 0,
          contactId: 1,
          lastTimeMessage: 1,
          lastMessage: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color"
        }
      },
      {
        $sort: { lastTimeMessage: -1 }
      }
    ]);
    console.log(contacts)

    return res.status(200).json({ contacts });
  } catch (error) {
    return res.status(400).json("Couldn't find contacts");
  }
};
