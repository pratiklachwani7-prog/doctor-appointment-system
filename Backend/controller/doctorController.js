import doctorModel from "../models/doctor.model.js";

//This functionilty is in the doctors Controller Because , these functionality is for the doctor as well as it is for the admin also

const changeAvailability = async (req , res) =>
{
    //Here the Pure Business Logic will be there for Changing the available (That the doctor is available or not) ...
    try
    {
        const {docId} = req.body ;

        const docData = await doctorModel.findById(docId) ;
        
        if (!docData )
        {
            return res.status(404).json({
                success:false,
                message:"Doctor Not Found",
            })
        }

        const newDocData = await doctorModel.findByIdAndUpdate(docId , {available : !docData.available} , {new : true}) ;

        res.status().json({
            success:true ,
            message:"Availability Changed",
            new_Doctor_Data : newDocData ,
        })
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success:false,
            message:"There was Some Problem",
            error:err.message
        })
    }
}



export {changeAvailability} ;