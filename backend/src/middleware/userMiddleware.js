const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');

const userMiddleware=async (req,res,next)=>{

    try{
        const {token}=req.cookies;
        if(!token)
        throw new Error("Token is not present ");
        const payload=  jwt.verify(token,process.env.JWT_KEY);

        const {_id}=payload;

        if(!_id){
            throw new Error("invalid");
        }

        const result= await User.findById(_id);
         if(!result){
            throw new Error("user Doesn't Exits");
         }

         //is this present in redis blocklist?
         const IsBlocked = await redisClient.exists(`token:${token}`);

         if (IsBlocked === 1)
         throw new Error("Invalid Token");

         req.result = result;
         req.user = {
             id: result._id,
             role: result.role
         };
         next();
    }

    catch(err){
      res.status(401).send("Error:"+err.message);
    }
}
module.exports=userMiddleware;