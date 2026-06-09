const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt=require("bcrypt");
const jwt =require('jsonwebtoken');
const authRouter=require("../routes/userAuth");
const redisClient = require("../config/redis");
const submission=require("../models/submission");
const Submission = require("../models/submission");

//register
const register = async (req, res) => {
  try {
    validate(req.body);

    const { password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);

    
    req.body.role = "user";

    const user = await User.create(req.body);

    const reply={
      firstName:user.firstName,
      lastName:user.lastName,
      emailId:user.emailId,
      role:user.role,
      _id:user._id
     }


    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
   res.status(200).json({
      user:reply,
      message:"Register Sucessfully"
    });

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

     const reply={
      firstName:user.firstName,
      lastName:user.lastName,
      emailId:user.emailId,
      role:user.role,
      _id:user._id
     }

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });

    res.status(201).json({
      user:reply,
      message:"Loggin Sucessfully"
    });

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

//aadmin register

const adminRegister = async (req, res) => {
  try {
    validate(req.body);

    const { password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);

    
    

    const user = await User.create(req.body);

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    res.status(201).send("User Registration Successfully");

  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};



const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    // delete user from the database
    await User.findByIdAndDelete(userId);

    // Delete all submissions belonging to this user
    await Submission.deleteMany({ userId });

    // blacklist token in Redis
    const { token } = req.cookies;
    if (token) {
      const payload = jwt.decode(token);
      if (payload && payload.exp) {
        await redisClient.set(`token:${token}`, 'Blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);
      }
    }

    
    res.cookie("token", null, {
      expires: new Date(Date.now())
    });

    res.status(200).send("deleted successfully");
  } catch (err) {
    res.status(500).send("Internal Server Error: " + err.message);
  }
};

const check = async (req, res) => {
  try {
    const user = req.result;
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    return res.status(200).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        role: user.role
      },
      message: "Authenticated successfully"
    });
  } catch (err) {
    return res.status(500).send("Internal Server Error: " + err.message);
  }
};

module.exports = {register, login, logout, adminRegister, deleteProfile, check};