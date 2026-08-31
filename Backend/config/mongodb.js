import mongoose from "mongoose" ;

const connectDB = async () => 
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database Connected Successfully") ;
    }
    catch(err)
    {
        console.log("LOL , Not able to connect to the mongoDB",err);
        process.exit(1) ;
    }
}

export default connectDB ;

