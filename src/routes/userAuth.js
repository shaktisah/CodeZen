const express=require('express');
const authRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');

const {register, adminRegister, login, logout}=require('../controllers/userAuthentication');

//register 
authRouter.post('/register', register);
authRouter.post('/admin/register', adminRegister);
//login
authRouter.post('/login', login);
//logout
authRouter.post('/logout', userMiddleware, logout);

module.exports=authRouter;
