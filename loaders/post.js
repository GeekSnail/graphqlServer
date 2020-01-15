const DataLoader = require("dataloader");
const { Post } = require("../models");
const redis = require("../utils/redis");
const RedisDataLoader = require("./redis-dataloader")({ redis });

// load(a username) => many posts
let batchPostsByUsername = async (keys, Post) => {
  console.log("postLoaders byname", keys);
  return keys.map(
    async key => await Post.find({ createdBy: key }).sort({ created: -1 })
  );
};

// loadMany(many _ids) => many posts
let batchPostsByIds = async (keys, Post) => {
  console.log("postLoaders byids ", keys);
  return await Post.find({
    _id: { $in: keys }
  }).sort({ created: -1 });
};

// loadMany(many _ids) => many posts
let batchPostsById = async (keys, Post) => {
  console.log("postLoaders byid_ ", keys, typeof keys[0]);
  let posts = await Post.find({ _id: { $in: keys } }).sort({ created: -1 });
  return keys.map(key =>
    posts.find(post => JSON.stringify(post._id) === JSON.stringify(key))
  );
  // return keys.map(async key => await Post.find({ _id: key }));
};

// a user load(ids) => many posts
// let batchPostsById_ = async (keys, Post) => {
//   console.log("postLoaders byid_ ", keys);
//   return keys.map(async key => await Post.find({ _id: { $in: key } }));
// };

module.exports = {
  // idLoader: new DataLoader(keys => batchPostsById(keys, Post)),
  idLoader: new RedisDataLoader(
    "",
    new DataLoader(keys => batchPostsById(keys, Post), { cache: false }),
    { cache: true }
  ),
  // idsLoader: new DataLoader(keys => batchPostsByIds(keys, Post)),
  idsLoader: new RedisDataLoader(
    "",
    new DataLoader(keys => batchPostsByIds(keys, Post), { cache: false }),
    { cache: true }
  ),
  // usernameLoader: new DataLoader(keys => batchPostsByUsername(keys, Post))
  usernameLoader: new RedisDataLoader(
    "",
    new DataLoader(keys => batchPostsByUsername(keys, Post), { cache: false }),
    { cache: true }
  )
};

// byids [ 5cbe3a9150bbf15934bca304 ]
// byname [ 'hu', 'hi' ]
// byids [ 5cb306bbc6d8307f50be3221, 5cb64ed13bfe5ff82cfd7c15 ]
// byname [ 'jeff', 'ha' ]
// byname [ 'hy' ]
