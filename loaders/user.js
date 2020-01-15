const DataLoader = require("dataloader");
const { User } = require("../models");
const redis = require("../utils/redis");
const RedisDataLoader = require("./redis-dataloader")({ redis });
//console.log(redis instanceof require('ioredis'))
//https://www.robinwieruch.de/graphql-apollo-server-tutorial/#apollo-server-subscriptions

// load(a username) => a user
let batchUsersByUsername = async (keys, User) => {
  console.log("userLoaders byname", keys, typeof keys[0]);
  return keys.map(
    async key => await User.findOne({ username: key }, { password: 0 })
  );
};

let batchUsersById = async (keys, User) => {
  console.log("userLoaders by_id ", keys);
  return keys.map(
    async key => await User.findOne({ _id: key }, { password: 0 })
  );
};
// let batchUsersById = async (keys, User) => {
//   console.log("userLoaders byid_ ", keys.length);
//   return new Promise((resolve, reject) => {
//     redis.mget(keys, async (err, results) => {
//       console.log(err, results);
//       if (results[0] == null) {
//         let docs = await User.find({ _id: { $in: keys } });
//         let idsMap = {};
//         docs.forEach(e => {
//           let o = {};
//           o[e._id] = JSON.stringify(e);
//           Object.assign(idsMap, o);
//         });
//         redis
//           .multi()
//           .mset(idsMap)
//           .mget(keys)
//           .exec((err, results) => {
//             err
//               ? reject(err)
//               : resolve(
//                   results[1][1].map((result, index) => JSON.parse(result))
//                 );
//           });
//       } else {
//         resolve(results.map((result, index) => JSON.parse(result)));
//       }
//     });
//   });
// };
// let usernameLoader = new DataLoader(keys => batchUsersByUsername(keys, User));
let usernameLoader = new RedisDataLoader(
  // set a prefix for the keys stored in redis. This way you can avoid key
  // collisions for different data-sets in your redis instance.
  "",
  // create a regular dataloader. This should always be set with caching disabled.
  new DataLoader(keys => batchUsersByUsername(keys, User), { cache: false }),
  // The options here are the same as the regular dataloader options, with
  // the additional option "expire"
  {
    // caching here is a local in memory cache. Caching is always done
    // to redis.
    cache: true
    // if set redis keys will be set to expire after this many seconds
    // this may be useful as a fallback for a redis cache.
    // expire: 60
    // can include a custom serialization and deserialization for
    // storage in redis.
    //serialize: date => date.getTime(),
    //deserialize: timestamp => new Date(timestamp)
  }
);

// let idLoader = new DataLoader(keys => batchUsersById(keys, User));
let idLoader = new RedisDataLoader(
  "",
  new DataLoader(keys => batchUsersById(keys, User), { cache: false }),
  { cache: true }
);

module.exports = {
  idLoader,
  usernameLoader
};
