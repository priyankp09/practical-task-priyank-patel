import { ErrorHandler } from "../utils/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {

        console.log("Enter in varify JWT ----->>>>>");
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized request',
        });
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password")
    
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Access Token',
            });
        }
    
        req.user = user;
        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error?.message || "Invalid access token",
        });
    }
    
})

