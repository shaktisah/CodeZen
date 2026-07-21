const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Token is not present");
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);

    const { _id } = payload;

    if (!_id) {
      throw new Error("Invalid token");
    }

    const result = await User.findById(_id);

    if (!result) {
      throw new Error("User doesn't exist");
    }

    // check redis blocklist
    const isBlocked = await redisClient.exists(`token:${token}`);

    if (isBlocked) {
      throw new Error("Token is blocked");
    }

    
    if (result.role !== 'admin') {
      throw new Error("Access denied: admin only");
    }

    req.user = result;
    next();

  } catch (err) {
    res.status(401).send("Error: " + err.message);
  }
};

module.exports = adminMiddleware;