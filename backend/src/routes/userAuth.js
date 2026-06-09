const express=require('express');
const authRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');

const {register, adminRegister, login, logout, deleteProfile, check}=require('../controllers/userAuthentication');

authRouter.post('/register', register);
authRouter.post('/admin/register', adminRegister);
authRouter.post('/login', login);
authRouter.get('/check', userMiddleware, check);
authRouter.post('/logout', userMiddleware, logout);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);

module.exports=authRouter;
