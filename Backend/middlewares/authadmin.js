import jwt from "jsonwebtoken" ;

//Admin authentication Middle Ware 

const authAdmin = async (req,res,next) =>
{
    try
    {
        const {adminToken} = req.header ;

        if (!adminToken)
        {
            return res.status(401).json({
                success:false ,
                message:"Kidhar hua Not authorized , Login again"
            })
        }

        //Verification of the token 

        const decodedToken = jwt.verify(adminToken , process.env.JWT_SECRET) ;
        if ( decodedToken != process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD )
        {
            return res.status(401).json({
                success:false ,
                message:"Not authorized , Login again"
            })
        }

        next() ;

    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            success : false ,
            message: "LOL",
            message: err.message ,
        })
    }
}

export default authAdmin ;