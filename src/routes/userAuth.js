const express=require('express');
const authRouter = express.Router();
const {register, login, logout, adminRegister}=require('../controllers/userAuthentication');
const userMiddleware=require("../middleware/userMiddleware");
const adminMiddleware=require("../middleware/adminMiddleware");


//register 
authRouter.post('/register',register);
//login
authRouter.post('/login',logout);
//logout
authRouter.post('/logout',userMiddleware,logout);
//for admin registartion
authRouter.post('/admin/register',adminMiddleware,adminRegister);

//delete profile
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);

authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply={
        firstName:req.result.firstName,
        emailId:req.result.emailId,
        _id:req.result._id
    }

    res.status(200).json({
        user:reply,
        message:"valid User"
    })
})

module.exports=authRouter;
