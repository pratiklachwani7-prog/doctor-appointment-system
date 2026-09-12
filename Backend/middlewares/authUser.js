import jwt from "jsonwebtoken" ;

//Admin authentication Middle Ware 

const authUser = async (req,res,next) =>
{
    try
    {
        // console.log(req.headers.authorization?.split(" ")[1] , req.cookies.token ) ;
        // const {adminToken} = req.headers.authorization?.split(" ")[1] ;
        // console.log(adminToken) ;
        // if (!adminToken) adminToken = req.cookies.token ;
        // console.log(adminToken) ;

        const userToken = req.cookies.loginToken ;

        if (!userToken)
        {
            return res.status(401).json({
                success:false ,
                message:"Kidhar hua User Not authorized , Login again"
            })
        }

        //Verification of the token 

        const decodedToken = jwt.verify(userToken , process.env.JWT_SECRET) ;
        
        req.userId = decodedToken.id ; //here we added the userId to the req.body 


        next() ;

    }
    catch(err)
    {
        console.log(err);
        res.status(401).json({
            success : false ,
            message: "LOL",
            message: err.message ,
        })
    }
}

export default authUser ;