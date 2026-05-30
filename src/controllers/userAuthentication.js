const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt=require("bcrypt");
const jwt =require('jsonwebtoken');
const authRouter=require("../routes/userAuth");
const redisClient = require("../config/redis");

//register
const register = async (req, res) => {
  try {
    validate(req.body);

    const { password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);

    
    req.body.role = "user";

    const user = await User.create(req.body);

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    res.status(201).send("User Registration Successfully");

  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

//adminRegister
const adminRegister = async (req, res) => {
  try {
    validate(req.body);

    const { password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);

    req.body.role = "admin";

    const user = await User.create(req.body);

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    res.status(201).send("Admin Registration Successfully");

  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

//login
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      throw new Error("Invalid credentials");
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error("User not found");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });

    res.status(200).send("Logged in successfully");

  } catch (err) {
    res.status(401).send("Error:" + err.message);
  }
};

//logout
const logout= async(req,res)=>{
    try{
        const {token}=req.cookies;
        const payload=jwt.decode(token);

        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);

        res.cookie("token", null, {
       expires: new Date(Date.now())
          });
        res.send("Logged Out Sucessfully");


    }
    catch(err){
       res.status(403).send("Error:"+err.message);
    }
}

module.exports = {register, adminRegister, login, logout};