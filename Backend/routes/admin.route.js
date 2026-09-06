import express from "express"
import { addDoctor , allDoctors, loginAdmin} from "../controller/adminController.js"
import upload from "../middlewares/multer.js"
import authAdmin from "../middlewares/authadmin.js";

const adminRouter = express.Router() ;

adminRouter.post("/add-doctor", authAdmin , upload.single('image') , addDoctor) ;   
//So whenever some one tries to add a doctor we will check for the token and when we have the token then only we will be able to add the doctor
adminRouter.post("/login", loginAdmin) ;   
//again whenever someOne tried to look for all doctors we should verify first that the request is comming from the admin only 
adminRouter.get ("/all-doctors",authAdmin,allDoctors) ;

export default adminRouter ;