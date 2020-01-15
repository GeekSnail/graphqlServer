const Redis = require("ioredis");
const redis = new Redis({ password: process.env.REDIS_PWD });
(async () => {
  if (process.env.NODE_ENV !== "production") {
    // await redis.del(listingCacheKey);
    let arr = [1, 2, 3];
    // await redis.flushall();
    // await redis.smembers("a");
    // await redis.sadd("a", ...arr, 3);
    // let a = await redis.smembers("a");
    // console.log(a);
    // await redis.rpush("a", ...arr);
    // console.log(await redis.lrange("a", 0, -1));
    console.log("..................................");
    await redis.flushall();
    return redis;
  }
  console.log("redis setup");
  console.log("..................................");
})();
// flushRedis();
module.exports = redis;
