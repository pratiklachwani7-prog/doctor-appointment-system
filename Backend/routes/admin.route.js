import express from "express"
import { addDoctor , loginAdmin} from "../controller/adminController.js"
import upload from "../middlewares/multer.js"
import authAdmin from "../middlewares/authadmin.js";

const adminRouter = express.Router() ;

adminRouter.post("/add-doctor", authAdmin , upload.single('image') , addDoctor) ;   
//So whenever some one tries to add a doctor we will check for the token and when we have the token then only we will be able to add the doctor
adminRouter.post("/login", loginAdmin) ;   

export default adminRouter ;