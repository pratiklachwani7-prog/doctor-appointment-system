import "dotenv/config" ;
import express from "express" ;
import cors from "cors" ;
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

// app config

const app = express() ;
const port = process.env.PORT || 4000

// middleWares

app.use(express.json()) ;
app.use(cors()) ;
connectDB() ;
connectCloudinary() ;

// api endpoints 

app.get('/', (req,res)=>{
    res.send("API is Working Like butter")
} )

app.listen(port , () => {console.log("Server started",port)}) ;

