//API for adding a Doctor 
import validator from "validator" ;
import bycrypt from "bcrypt" ;
import {v2 as cloudinary} from "cloudinary" ;
import doctorModel from "../models/doctor.model.js"

const addDoctor = async (req,res) => 
{
    try
    {
        const { name , email , password , speciality , degree , experience , about , fees , address } = req.body
        //so now i need to add these data into a FOrmal document or a FORM so to pass the form data we need a middleWare 
        const imageFile = req.file ;

        // console.log({ name , email , password , speciality , degree , experience , about , fees , address } , imageFile) ;

        //Checking for all data to add Doctor
        if ( !name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address )
        {
            return res.status(400).json({
                success : false ,
                message : "Some details was Missing",
            })
        }   
        
        //Validating Email Format 
        if ( !validator.isEmail(email) )
        {
            return res.status(400).json({
                success : false ,
                message : "Email was not in the right format",
            })
        }

        //Validating Strong password
        if ( !validator.isStrongPassword(password)  )
        {
            return res.status(400).json({
                success : false ,
                message : "Password was not strong enough",
            })
        }
        // <---------Validation of the Data is over----------------------->

        //We will encrypt the password to save it in the database 

        //First we have to generate a salt to for hashing the password
        const salt = await bycrypt.genSalt(10) //here number of rounds for Encrypting the password [5,50] ;
        const hashedPassword = await bycrypt.hash(password , salt) ; //this will give us the encrypted password in this variable

        //<--------------------------Now we have all the user data------------------------------------>

        //Now uploading the profile picture in cloduinary 

        const imageUpload = await cloudinary.uploader.upload( imageFile.path,{resource_type:"image"} ) ;

        const imageUrl = imageUpload.secure_url ;

        const doctorData = 
        {
            name ,
            email ,
            image : imageUrl ,
            password : hashedPassword ,
            speciality ,
            degree ,
            experience ,
            about ,
            fees ,
            address: JSON.parse(address) ,
            date : Date.now() ,

        }

        const newDoctor = new doctorModel(doctorData) ;
        await newDoctor.save();

        res.status(201).json({
            success : true ,
            message:"New Doctor was Added" ,
        })

    }   
    catch(err)  
    {
        console.log(err);
        res.status(201).json({
            success : false ,
            message: "LOL",
            message: err.message ,
        })
    }
}

export {addDoctor} ;