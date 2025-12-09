import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


const verifyjwt = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Check if refresh token is expired (optional, not always necessary here)
    if (refreshToken) {
      try {
        const decodedRefresh = jwt.decode(refreshToken);
        const expiryTimestamp = decodedRefresh?.exp * 1000;
        if (Date.now() > expiryTimestamp) {
          res.clearCookie("refreshToken");
        }
      } catch (err) {
        console.log("Invalid refresh token format");
      }
    }

    const AccessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log("Access Token : ", AccessToken);

    if (!AccessToken) {
      return res.status(401).json({ message: "User is not logged in" });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(AccessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      // 👉 Check if token is expired
      if (error.name === "TokenExpiredError") {
        // Try refreshing the access token
        if (refreshToken) {
          try {
            const refreshedPayload = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );

            const user = await User.findById(refreshedPayload._id);
            if (!user) return res.status(401).json({ message: "User not found" });

            const newAccessToken = user.generateAccessToken(); // your custom function

            // Set new access token in cookie
            res.cookie("accessToken", newAccessToken, {
              httpOnly: true,
              secure: true,
              sameSite: "Strict",
              maxAge: 15 * 60 * 1000, // 15 min
            });

            // Attach user and continue
            req.user = user;
            
            return next();
          } catch (refreshError) {
            return res.status(401).json({ message: "Refresh token invalid or expired" });
          }
        } else {
          return res.status(401).json({ message: "Access token expired" });
        }
      } else {
        return res.status(401).json({ message: "Invalid token" });
      }
    }

    // Token is valid, get user
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export { verifyjwt };
