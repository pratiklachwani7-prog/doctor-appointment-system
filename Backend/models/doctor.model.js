import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
    {
        name : 
        {
            type : String ,
            required : [true , "Doctor name is mandatory to Create a new Doctor"],
        } ,
        email :
        {
            type : String ,
            required : [true,"Doctor email is mandatory to Create a new Doctor"],
            unique : [true,"Email Should be Unique"],
        } ,
        password :
        {
            type : String , 
            required : [true,"Password is required to create a new Doctor"],
        } ,
        image :
        {
            type : String ,
            required : [true,"Upload a Profile Image"] ,
        } ,
        speciality :
        {
            type : String ,
            required : [true,"State your Speciality"] ,
        } ,
        degree :
        {
            type : String ,
            required : [true,"State your Degree"] ,
        } ,
        experience :
        {
            type : String ,
            required : [true,"State your Experience"] ,
        } ,
        about : 
        {
            type : String ,
            required : [true,"State Something About YourSelf"] ,
        } ,
        available : 
        {
            type : Boolean ,
            required : [true,"Are you available or not"] ,
            default:true ,
        } ,
        fees : 
        {
            type : Number ,
            required : [true , "What is your fees"] ,
        } ,
        address :
        {
            type : Object ,
            required : [true,"Enter your address"],
        } ,
        date :
        {
            type : Date ,
            required : true ,
        } ,
        slots_booked :
        {
            type : Object ,
            default : {} ,
        }
    } ,
    {
        minimize : false 
    }
)

const doctorModel = mongoose.models.doctor || mongoose.model("doctor",doctorSchema) ;

export default doctorModel ;