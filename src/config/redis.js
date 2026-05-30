const { createClient } = require('redis');

const redisOptions = {
    socket: {
        host: process.env.REDIS_HOST_ID || '127.0.0.1',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
    }
};

if (process.env.REDIS_PASS) {
    redisOptions.password = process.env.REDIS_PASS;
}

const redisClient = createClient(redisOptions);

redisClient.on('error', (err) => {
    console.log('Redis Error:', err);
});

module.exports = redisClient;