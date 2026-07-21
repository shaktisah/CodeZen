const redisClient = require('../config/redis');

const submitCodeRateLimiter = async (req, res, next) => {
    const userId = req.result._id; 
    const redisKey = `submit_cooldown:${userId}`;

    try {
        
        const exists = await redisClient.exists(redisKey);

        if (exists) {
            return res.status(429).send("Please wait 10 seconds before submitting again.");
        }

       
        await redisClient.setEx(redisKey, 10, "active");

        next();
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
};

module.exports = submitCodeRateLimiter;
