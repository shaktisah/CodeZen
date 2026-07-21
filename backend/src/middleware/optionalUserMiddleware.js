const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');

const optionalUserMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
        if (token) {
            const payload = jwt.verify(token, process.env.JWT_KEY);
            if (payload && payload._id) {
                const isBlocked = await redisClient.exists(`token:${token}`).catch(() => 0);
                if (isBlocked !== 1) {
                    const result = await User.findById(payload._id);
                    if (result) {
                        req.result = result;
                        req.user = { id: result._id, role: result.role };
                    }
                }
            }
        }
    } catch (err) {
        // Proceed gracefully for guests
    }
    next();
};

module.exports = optionalUserMiddleware;
