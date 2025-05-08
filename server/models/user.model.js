import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        email: {
            required: true,
            type: String,
            unique: [true, "Email is required"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        firstName: {
            type: String,
            required: false,
        },
        lastName: {
            type: String,
            required: false,
        },
        image: {
            type: String,
            required: false,
        },
        color: {
            type: Number,
            required: false,
        },
        profileSetup: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
            required: true,
        },
    },
    { timestamps: true } // Fixed typo from timeStamps to timestamps
);

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Correct export
export const User = model("User", userSchema);
