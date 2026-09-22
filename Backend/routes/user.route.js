import express from "express" ;
import { getProfile, loginUser, registerUser, updateProfile , bookAppointment , listAppointments , cancelAppointment , paymentRazerPay } from "../controller/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router() ;


userRouter.post("/register",registerUser) ;
userRouter.post("/login",loginUser) ;
userRouter.get("/get-profile",authUser,getProfile) ;
userRouter.post("/update-profile", upload.single('image') , authUser , updateProfile) ; 
userRouter.post("/book-appointment", authUser , bookAppointment) ;    
userRouter.get("/appointments", authUser , listAppointments) ;    
userRouter.post("/cancel-appointment", authUser , cancelAppointment) ;
userRouter.post("/payment-razorpay", authUser , paymentRazerPay) ;


export default userRouter ;