//API for adding a Doctor 

const addDoctor = async (req,res) => 
{
    try
    {
        const { name , email , password , speciality , degree , experience , about , fees , address } = req.body
        //so now i need to add these data into a FOrmal document or a FORM so to pass the form data we need a middleWare 

        const imageFile = req.file ;

        console.log({ name , email , password , speciality , degree , experience , about , fees , address } , imageFile) ;

    }   
    catch(err)  
    {

    }
}

export {addDoctor} ;