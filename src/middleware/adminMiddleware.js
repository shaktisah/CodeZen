const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Token is not present");
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      throw new Error("Invalid or expired token");
    }

    const { _id } = payload;

    if (!_id) {
      throw new Error("Invalid token payload");
    }

    const result = await User.findById(_id).select("role email");

    if (!result) {
      throw new Error("User doesn't exist");
    }

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked === 1) {
      throw new Error("Token is blocked");
    }

    if (result.role !== 'admin') {
      throw new Error("Access denied: admin only");
    }

    req.user = {
      id: result._id,
      role: result.role
    };

    next();

  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = adminMiddleware;