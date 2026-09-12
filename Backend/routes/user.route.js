import express from "express" ;
import { getProfile, loginUser, registerUser } from "../controller/userController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router() ;


userRouter.post("/register",registerUser) ;
userRouter.post("/login",loginUser) ;
userRouter.get("/get-profile",authUser,getProfile) ;

export default userRouter ;