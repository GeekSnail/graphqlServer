const DataLoader = require("dataloader");
const { Comment } = require("../models");
const redis = require("../utils/redis");
const RedisDataLoader = require("./redis-dataloader")({ redis });

// loadMany(many _ids) => many posts
// let batchComment = async (keys, Comment) => {
//   console.log("commLoaders byids ", keys);
//   return await Comment.find({
//     _id: { $in: keys }
//   });
// };

// let batchComments = async (keys, Comment) => {
//   console.log("commLoaders byid_ ", keys.length);
//   return new Promise((resolve, reject) => {
//     redis.mget(keys, async (err, results) => {
//       if (results[0] == null) {
//         let users = await Comment.find({ _id: { $in: keys } });
//         let idsMap = {};
//         users.forEach(e => {
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
// return new Promise((resolve, reject) => {
//   redis.mget(keys, async (err, results) => {
//     return results[0] == null
//       ? reject(await Comment.find({ _id: { $in: keys } }))
//       : resolve(results.map((result, index) => JSON.parse(result)));
//   });
// })
//   .then(res => res)
//   .catch(res => {
//     console.log(res.length);
//     let idsMap = {};
//     res.forEach(e => {
//       let o = {};
//       o[e._id] = JSON.stringify(e);
//       Object.assign(idsMap, o);
//     });
//     redis.mset(idsMap);
//     return res;
//   });

// return await Comment.find({ _id: { $in: keys } });
// return keys.map(async key => await Comment.find({ _id: key }));
// };
let batchComments = async (keys, Comment) => {
  return await Comment.find({ _id: { $in: keys } });
};
// module.exports = new DataLoader(keys => batchComments(keys, Comment));
module.exports = new RedisDataLoader(
  "",
  new DataLoader(keys => batchComments(keys, Comment), { cache: false }),
  { cache: true }
);
