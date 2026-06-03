const redisClient = require('../config/redis');

const submitCodeRateLimiter = async (req, res, next) => {
    const userId = req.result._id; // Assumes user middleware has already run
    const redisKey = `submit_cooldown:${userId}`;

    try {
        // Check if the cooldown key exists in Redis (returns 1 if true, 0 if false)
        const exists = await redisClient.exists(redisKey);

        if (exists) {
            return res.status(429).send("Please wait 10 seconds before submitting again.");
        }

        // Set the key with a 10-second expiration time
        await redisClient.setEx(redisKey, 10, "active");

        next();
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
};

module.exports = submitCodeRateLimiter;
