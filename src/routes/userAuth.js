const express=require('express');

const authRouter = express.Router();

const {register, adminRegister, login, logout}=require('../controllers/userAuthentication');

//register 
authRouter.post('/register', register);
authRouter.post('/admin/register', adminRegister);
//login
authRouter.post('/login', login);
//logout
authRouter.post('/logout', logout);

module.exports=authRouter;
