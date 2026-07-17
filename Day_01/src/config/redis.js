// const { createClient } = require('redis');

// const redisClient = createClient({
//     socket: {
//         host: 'localhost',
//         port: 6379
//     }
// });

// redisClient.on('error', (err) => console.log('Redis Error', err));

// module.exports = redisClient;


const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-14546.crce217.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 14546
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected to Cloud!'));

module.exports = redisClient;