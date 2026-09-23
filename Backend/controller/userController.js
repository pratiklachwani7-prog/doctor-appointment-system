import validator from 'validator' ;
import bycrypt from 'bcrypt' ;
import userModel from '../models/user.model.js';
import doctorModel from '../models/doctor.model.js';
import {v2 as cloudinary} from 'cloudinary'

import jwt from 'jsonwebtoken' ;
import appointmentModel from '../models/appointment.model.js';

import razorpay from "razorpay" ;
import { CurrencyCodes } from 'validator/lib/isISO4217.js';
//Here we will create the business logic for the Users for  login , register , get profile , update Profile , book appointment , displaying the book appointment , cancelling the book appointment and also payment Gateway

//Api to register User

const registerUser = async (req,res) =>
{
    try 
    {
        const {name , email , password } = req.body

        if ( !name || !email || !password )
        {
            return res.status(400).json({
                success:false ,
                message:"Some Details we Missing",
            })
        }

        if ( !validator.isEmail( email )  )
        {
            return res.status(400).json({
                success:false,
                message:"Email is not Valid"
            })
        }

        if ( !validator.isStrongPassword( password )  )
        {
            return res.status(400).json({
                success:false,
                message:"Password is not Strong Enough" ,
            })
        }

        const salt = await bycrypt.genSalt(10) ;
        const hashedPassword = await bycrypt.hash(password,salt) ;

        const userData = {
            name ,
            email ,
            password : hashedPassword ,
        }

        const newUser = await userModel.create(userData) ;

        const userToken = jwt.sign( {id:newUser._id} , process.env.JWT_SECRET ) ;

        res.cookie("userToken",userToken , {httpOnly:true}) ;

        return res.status(201).json({
            success:true ,
            message:"User Was Added Successfully",
            newUser ,
            userToken,
        })

    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Registering User , Something went Wrong",
            error : err.message,
        })
    }
}

const loginUser = async ( req , res ) => 
{
    try 
    {
        const {email , password} = req.body ;
        const user = await userModel.findOne({email}) ;

        if ( !user )
        {
            return res.status(401).json({
            success:false ,
            message:"User Doesn't Exist",
            })
        }

        const isMatched = await bycrypt.compare( password , user.password ) ;

        if ( !isMatched ) 
        {
            return res.status(401).json({
            success:false ,
            message:"Invalid Credentials", 
            })
        }
        else
        {
            const token = jwt.sign( {id:user._id} , process.env.JWT_SECRET) ;

            res.cookie("loginToken",token,{httpOnly:true}) ;

            res.status(200).json({
                success:true,
                message:token ,
            })
        }
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Login User , Something went Wrong",
            error : err.message,
        })
    }
}

const getProfile = async (req , res) =>
{
    try 
    {
        //we will use userId for authentication    
        const userId  = req.userId ;
        //so we will send the token and from token we will get the userId ; , so we have to make a middleware such that it converts the headers to user id req.body ;

        const userData = await userModel.findById( userId ).select('-password') ;

        if ( !userData )
        {
            return res.status(404).json({
                success:false ,
                message:"User Not found"
            })
        }

        return res.status(200).json({
            success:true,
            userData ,
        })
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Getting Profile , Something went Wrong",
            error : err.message,
        })    
    }
}

//Now to update the user Profile 

const updateProfile = async (req , res) =>
{
    try 
    {
        const { userId } = req ;
        const {name , phone , address , dob , gender} = req.body ;
        const imageFile = req.file ;

        if ( !name || !phone || !dob || !gender )
        {
            return res.status(400).json({
                success:false ,
                message:"Some of the Data is missing" ,
            })
        }

        let updatedUser ;

        if ( imageFile )
        {
            //We will upload this image in the cloudinary and update the profile in the data base 

            //Upload Image to Cloudinary 

            const imageUpload = await cloudinary.uploader.upload( imageFile.path , {resource_type : "image"} ) ;

            //This imageUpload is a image URl ,
            console.log("The imageUpload object is :- ",imageUpload) ;
            const imageURL = imageUpload.secure_url ;

            updatedUser = await userModel.findByIdAndUpdate( userId , { image : imageURL } , {new : true}) ; 
        }

        updatedUser = await userModel.findByIdAndUpdate( userId , {name , phone , address:JSON.parse(address)  , dob , gender  }
         , {new : true} )  ;

         return res.status(200).json({
            success: true ,
            message:"Updated Successfully" ,
            updatedUser ,
         })
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Updating Profile , Something went Wrong",
            error : err.message,
        })       
    }
}

//Now we have to create a logic for booking a appointment

const bookAppointment = async (req , res) => 
{
    try 
    {
        const { userId } = req ;
        
        const { docId , slotDate , slotTime}  = req.body ;

        if ( !userId || !slotDate || !slotTime )
        {
            return res.status(400).json({
                success:"false",
                message:"Some Information is missing",
            })
        }

        const docData = await doctorModel.findById( docId ).select('-password') ;

        if ( !docData)
        {
            return res.status(404).json({
                success:"false",
                message:"Doctor not found",
            })
        }

        if ( !docData.available )
        {
            return res.status(409).json({
                success:"false",
                message:"Doctor is not Available",
            })
        }

        let slotsBooked = docData.slots_booked
        //Checking for the slot availability 
        if ( slotsBooked[slotDate] )
        {
            if ( slotsBooked[slotDate].includes(slotTime) )
            {
                return res.status(409).json({
                    success:"false",
                    message:"Slot is not Empty",
                })
            }
            else
            {
                slotsBooked[slotDate].push(slotTime) ;
            }
        }
        else
        {
            slotsBooked[slotDate] = [] ;
            slotsBooked[slotDate].push(slotDate) ;
        }

        const userData  = await userModel.findById(userId).select('-password') ;

        delete docData.slots_booked

        const appointmentData = {
            userId ,
            docId , 
            userData , 
            docData ,
            amount:docData.fees,
            slotTime,
            slotDate ,
            date : Date.now() 
        }

        const newAppointment = await appointmentModel.create( appointmentData ) ;

        //save new slots data in docData 

        await doctorModel.findByIdAndUpdate( docId , {slotsBooked} ) ;

        return res.status(201).json({
            success:true ,
            message:"Appointment Booked" ,
            newAppointment
        })


    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Booking the Slot , Something went Wrong",
            error : err.message,
        })           
    }
}

//Creating a API to Fetch all the Appointments for the logged in User

const listAppointments = async ( req , res ) =>
{
    try
    {
        const { userId } = req ;
        const appointments = await appointmentModel.find( {userId} ) ;

        return res.status(200).json({
            success:true,
            message:"All Appointments Fetched" ,
            number_of_Appointments : appointments.length ,
            Appointments : appointments ,
        })
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Booking the Slot , Something went Wrong",
            error : err.message,
        })           
    }
}

//Now I need a API to Cancel the Appointment 

const cancelAppointment = async (req,res) =>
{
    try 
    {
        const { userId } = req ;

        const { appointmentId } = req.body ;

        const appointmentData = await appointmentModel.findById( appointmentId ) ;

        // Verifying Appointment User 

        if ( appointmentData.userId != userId ) 
        {
            return res.status(403).json({
                success:false ,
                message:"",
            })
        }

        await appointmentModel.findByIdAndUpdate( appointmentId , { cancelled : true } ) ;

        // releasing the Doctors Slot

        const { docId , slotDate , slotTime } = appointmentData ;

        const doctorData = await doctorModel.findById( docId ) ;

        let slotsBooked = doctorData.slots_booked ;

        console.log(slotsBooked) ;

        slotsBooked[slotDate] = slotsBooked[slotDate].filter( e => e !== slotTime ) ;

        await doctorModel.findByIdAndUpdate( docId , {slotsBooked} ) ;

        return res.status(200).json({
            success:true,
            message:"Appointment Cancelled" 
        })

    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Booking the Slot , Something went Wrong",
            error : err.message,
        })               
    }
}

//API of making an payment of appointment using razerPay 

const razorPayInstance = new razorpay({
    key_id : process.env.RAZORPAY_KEY_ID , 
    key_secret : process.env.RAZORPAY_KEY_SECRET ,
})

const paymentRazerPay = async (req,res) =>
{

    try 
    {
        
        const { appointmentId } = req.body ;
    
        const appointmentData = await appointmentModel.findById( appointmentId ) ;
    
        if ( !appointmentData || appointmentData.cancelled  )
        {
            return res.status(400).json({
                message:"Appointment Cancelled or not found",
            })
        }
    
        // Creating Options for Razor Payments 
    
         const options = {
            amount : appointmentData.amount * 100 ,
            currency : process.env.CURRENCY ,
            receipt : appointmentId ,
         }
    
         const order = await razorPayInstance.orders.create(options)
    
         res.status(201).json({
            success:true ,
            message:"Order Created",
            order
         })
    } 
    catch (error) 
    {
        console.log(err);
        return res.status(500).json({
            success:false ,
            message:"While Booking the Slot , Something went Wrong",
            error : err.message,
        })      
    }


} 
export {registerUser,loginUser,getProfile , updateProfile , bookAppointment , listAppointments , cancelAppointment , paymentRazerPay } ;