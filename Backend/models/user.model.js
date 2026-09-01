import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name : 
        {
            type : String ,
            required : [true , "User name is mandatory to Create a new User"],
        } ,
        email :
        {
            type : String ,
            required : [true,"User email is mandatory to Create a new User"],
            unique : [true,"Email Should be Unique"],
        } ,
        password :
        {
            type : String , 
            required : [true,"Password is required to create a new User"],
        } ,
        image :
        {
            type : String ,
            default : "data:image/webp;base64,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" ,
        } ,
        address :
        {
            type : Object ,
            default : 
            {
                line1 : "" ,
                line2 : "" ,
            }
        } ,
        gender :
        {
            type : String ,
            default : "Not Selected" ,
        } ,
        dob :
        {
            type : String ,
            default : "Not Selected" ,
        } ,
        phone :
        {
            type : String ,
            default : "0000000000",
        }

    } 
)

const userModel = mongoose.models.user || mongoose.model("user",userSchema) ;

export default userModel ;