import validator from 'validator' ;
import bycrypt from 'bcrypt' ;
import userModel from '../models/user.model.js';

import jwt from 'jsonwebtoken' ;
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

        res.status(201).json({
            success:true ,
            message:"User Was Added Successfully",
            newUser ,
            userToken,
        })

    } 
    catch (err) 
    {
        console.log(err);
        res.status(500).json({
            success:false ,
            message:"While Registering User , Something went Wrong",
            error : err.message,
        })
    }
}

export {registerUser} ;