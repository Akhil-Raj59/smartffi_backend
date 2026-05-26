import AppError from "../utils/appError.js";
import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.middleware.js";
const isLoggedIn =async (req,res,next) => {
    const {token} = req.cookies;
    if(!token){
        return next(new AppError("Unauthorized access, please login",401));
    } 
    const userDetails = await jwt.verify(token,process.env.JWT_SECRET);
    req.user = userDetails;
    next();

}
 const authorizeRoles = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to view this route", 403)
      );
    }
     next();
  });
  
export { 
    isLoggedIn ,
    authorizeRoles
};
