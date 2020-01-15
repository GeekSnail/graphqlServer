const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("./utils/file.upload");
const { log, logerr } = require("./utils/log_config");
const { PubSub } = require("apollo-server-express");
const pubsub = new PubSub();
const mongoose = require("mongoose");

const createToken = (user, secret, expiresIn) => {
  const { _id, email, username } = user;
  return jwt.sign({ _id, email, username }, secret, { expiresIn });
};

let msgs = [{ id: 0, content: "Hello!" }, { id: 1, content: "Bye!" }];
const MESSAGE_CREATED = "MESSAGE_CREATED";
const POST_CREATED = "POST_CREATED";
module.exports = {
  Subscription: {
    msgCreated: {
      subscribe: () => pubsub.asyncIterator(MESSAGE_CREATED)
    },
    postCreated: {
      subscribe: () => pubsub.asyncIterator(POST_CREATED)
    }
  },
  User: {
    posts: {
      resolve: async (_, args, { postLoaders }, info) => {
        // return postLoaders.usernameLoader.load(_.username);
        // if (_.username == "jeff") console.log(_);
        if (_.posts.length) {
          return postLoaders.idLoader.loadMany(_.posts);
        } else return [];
      }
    },
    favorites: {
      resolve: async (_, args, { postLoaders }, info) => {
        // return postLoaders.idsLoader.loadMany(_.favorites);
        console.log("hi");
        if (_.favorites.length) {
          console.log(_.favorites[0] instanceof mongoose.Types.ObjectId);
          return postLoaders.idLoader.loadMany(_.favorites);
        } else return [];
      }
    }
  },
  Post: {
    author: {
      //fragment: `fragment createdBy on Post`,
      resolve: async (_, args, { userLoaders }, info) => {
        return userLoaders.usernameLoader.load(_.createdBy);
      }
    },
    comments: {
      fragment: `... on  { employeeId }`,
      resolve: async (_, args, { commentLoader }, info) => {
        if (_.comments.length) return commentLoader.loadMany(_.comments);
        else return [];
      }
    }
  },
  Comment: {
    user: {
      resolve: async (_, args, { userLoaders }, info) => {
        // console.log(_.user);
        return userLoaders.idLoader.load(_.user);
      }
    }
  },
  Query: {
    msgs: () => msgs,
    // return more item of a user
    getCurrentUser: async (_, args, { User, currentUser, userLoaders }) => {
      await currentUser;
      console.log("current", currentUser);
      log.info("[currentUser]", currentUser, Date.now());
      if (!currentUser) return null;
      // const user = await User.findOne(
      //   { email: currentUser.email },
      //   { email: 0, password: 0 }
      // );
      // .populate([
      //   {
      //     path: "favorites",
      //     model: "Post"
      //   },
      //   {
      //     path: "collections",
      //     model: "Post"
      //   }
      // ]);
      // return user;
      return userLoaders.idLoader.load(currentUser._id);
    },
    batchUsers: async (_, {}, { User, Post, postLoaders, redis }, info) => {
      let userIds = await redis.get("userIds");
      if (userIds) {
        let users = await redis.mget(JSON.parse(userIds));
        console.log(users.length);
        if (users.length) return users.map(user => JSON.parse(user));
      } else {
        // let users = await redis.mget("batchUsers");
        let users = await User.find({}).sort({ created: -1 });
        let idsMap = {};
        userIds = JSON.stringify(
          users.map(user => {
            let o = {};
            o[user._id] = JSON.stringify(user);
            Object.assign(idsMap, o);
            return user._id;
          })
        );
        redis
          .multi()
          .set("userIds", userIds)
          .mset(idsMap)
          .exec();
        return users;
      }
      // let users = await User.find({})
      //   .populate({ path: "favorites", model: "Post" })
      //   .sort({ created: -1 });
      // for (let user of users) {
      //   user.posts = await Post.find({ createdBy: user.username });
      // }
      // let users = await User.find({})
      //   .sort({ created: -1 })
      //   .lean();
      // for (let user of users) {
      //   user.favorites = postLoaders.idLoader.load(user.favorites);
      //   user.posts = postLoaders.usernameLoader.load(user.username);
      // }
      // return users;
    },
    getUser: async (_, { username }, { User, userLoaders }, info) => {
      console.log(username);
      return userLoaders.usernameLoader.load(username);
      // let user = await User.findOne(
      //   { username },
      //   {
      //     password: 0,
      //     collectionsSize: 0,
      //     collections: 0
      //   }
      // );
      // let selections = info.fieldNodes[0].selectionSet.selections
      //   .filter(e => !!e.selectionSet)
      //   .map(e => ({
      //     fieldName: e.name.value,
      //     selections: [
      //       ...new Set(e.selectionSet.selections.map(e => e.name.value)) //get fieldName and clear duplicated
      //     ]
      //   }));
      // if (withPosts) {
      //   log.info("posts");
      //   user.posts = await Post.find({ createdBy: username }).sort({
      //     created: "desc"
      //   });
      // }
      // if (withFavorites) {
      //   log.info("favorites");
      //   user = await User.populate(user, {
      //     path: "favorites",
      //     model: "Post"
      //   });
      // }
      // log.info(
      //   !!user.favorites && user.favorites.length,
      //   !!user.posts && user.posts.length
      // );
      // return user;
    },
    batchPosts: async (_, args, { Post, redis }, info) => {
      // return await Post.find({}).sort({ created: -1 });
      // let posts = await redis.smembers("batchPosts");
      // console.log(posts.length);
      // if (posts.length) return posts.map(post => JSON.parse(post));
      // posts = await Post.find({}).sort({ created: -1 });
      // redis.sadd("batchPosts", ...posts.map(post => JSON.stringify(post)));
      // return posts;
      let postIds = await redis.get("postIds");
      if (postIds) {
        let posts = await redis.mget(JSON.parse(postIds));
        console.log(posts.length);
        if (posts.length) return posts.map(post => JSON.parse(post));
        else return [];
      } else {
        let posts = await Post.find({}).sort({ created: -1 });
        let idsMap = {};
        postIds = JSON.stringify(
          posts.map(post => {
            let o = {};
            o[post._id] = JSON.stringify(post);
            Object.assign(idsMap, o);
            return post._id;
          })
        );
        redis
          .multi()
          .set("postIds", postIds)
          .mset(idsMap)
          .exec();
        return posts;
      }
    },
    getPosts: async (_, args, { Post }) => {
      const posts = await Post.find({})
        .sort({ created: "desc" })
        // .populate("author")
        .limit(7);
      return posts;
    },
    getUserPosts: async (_, { username }, { currentUser, postLoaders }) => {
      // const posts = await Post.find({
      //   createdBy: username
      // }).sort({ created: "desc" });
      return postLoaders.usernameLoader.load(username);
    },
    postsByIds: async (_, { ids }, { postLoaders }) => {
      return postLoaders.idLoader.loadMany(ids);
    },
    getPost: async (_, { postId }, { Post, postLoaders }) => {
      // const post = await Post.findOne({ _id: postId }).populate([
      //   "author",
      //   {
      //     path: "comments",
      //     model: "Comment",
      //     populate: {
      //       path: "user",
      //       model: "User"
      //     }
      //   }
      // ]);
      return postLoaders.idLoader.load(postId);
    },
    searchPosts: async (_, { searchTerm }, { Post }) => {
      if (searchTerm) {
        // https://docs.mongodb.com/manual/text-search/index.html
        // const searchResults = await Post.find(
        //   // perform text search for search value of 'searchTerm'
        //   { $text: { $search: /searchTerm/ } },
        //   // Assign 'searchTerm' a text score to provide best match
        //   { score: { $meta: "textScore" } }
        //   // sort results according to the textScore (as well as by likes in descending order)
        // )
        //   .sort({
        //     score: { $meta: "textScore" },
        //     likes: "desc"
        //   })
        //   .limit(5);
        let reg = new RegExp(
          "[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]"
        );
        log.info("search character:", searchTerm);
        let searchArr = [
          ...new Set(
            searchTerm
              .trim()
              .split(reg)
              .join(" ")
              .split(/\s+/)
              .sort()
          )
        ]; //过滤特殊字符,去重
        let searchStr = searchArr.join("|");
        if (searchArr[0] === "|") searchStr = searchArr.slice(0, 1);
        log.info("cleared search character:", searchStr);
        //let searchResults = [];
        const searchResults = await Post.find({
          $or: [
            { tags: { $regex: searchStr } },
            { description: { $regex: searchStr } }
          ]
        }).sort({ likes: "desc" });
        console.log("search Results:", searchResults);
        return searchResults;
      }
    },
    infiniteScrollPosts: async (_, { pageNum, pageSize }, { Post }) => {
      let posts;
      if (pageNum === 1) {
        posts = await Post.find({})
          .sort({ created: "desc" })
          .populate("author")
          .limit(pageSize);
      } else {
        const skips = pageSize * (pageNum - 1);
        posts = await Post.find({})
          .sort({ created: "desc" })
          .populate("author")
          .skip(skips)
          .limit(pageSize);
      }
      log.info("[response] pageNum & pageSize", pageNum, pageSize, "\n", posts);
      const totalDocs = await Post.countDocuments();
      const hasMore = totalDocs > pageSize * pageNum;
      return { posts, hasMore };
    }
  },
  Mutation: {
    addMsg: (_, { id, content }) => {
      msgs.push({ id, content });
      pubsub.publish(MESSAGE_CREATED, { msgCreated: { id, content } });
      return { id, content };
    },
    addPost: async (
      _ /* root */,
      { image, naturalWidth, naturalHeight, tags, description, userId },
      { Post, User, Image, currentUser, userLoaders, redis }
    ) => {
      await image;
      log.info("image onload");
      if (!currentUser || currentUser._id != userId) {
        throw new Error("user invalid or unauthenticated");
      } else {
        try {
          const result = await uploadFile(image);
          log.info("upload success!");
          new Image({ ...result, naturalWidth, naturalHeight }).save();
          image = {
            url: result.path,
            naturalWidth,
            naturalHeight
          };
          const newPost = await new Post({
            image,
            tags,
            description,
            createdBy: currentUser.username
          }).save();
          //pubsub.publish(POST_ADDED, { postAdded: newPost });
          pubsub.publish(POST_CREATED, { postCreated: newPost });
          User.findOneAndUpdate(
            { _id: userId },
            {
              $push: { posts: { $each: [newPost._id], $position: 0 } },
              $inc: { postsSize: 1 }
            },
            { new: true }
          ).then(doc => {
            userLoaders.usernameLoader.prime(currentUser.username, doc);
          });
          return newPost;
        } catch (err) {
          logerr(err);
        }
      }
    },
    updateUserPost: async (
      _,
      { postId, userId, categories, description },
      { Post, currentUser, postLoaders }
    ) => {
      console.log(currentUser, userId);
      if (!currentUser || currentUser._id != userId) {
        throw new Error("user invalid or unauthenticated");
      } else {
        // try {
        const post = await Post.findOneAndUpdate(
          // find post by postId and createdBy
          { _id: postId, createdBy: currentUser.username },
          { $set: { categories, description } },
          { new: true }
        );
        postLoaders.idLoader.prime(postId, post);
        return post == null ? new Error("post is not matched with user") : post;
        // } catch (err) {
        //   logerr(err);
        //   throw new Error("post is not matched with user");
        // }
      }
    },
    deleteUserPost: async (
      _,
      { postId, username },
      { Post, currentUser, postLoaders, userLoaders }
    ) => {
      if (!currentUser || currentUser.username != username)
        throw new Error("user invalid or unauthenticated");
      else {
        const post = await Post.findOneAndRemove({
          _id: postId,
          createdBy: username
        });
        if (post) {
          // return Promise.all([
          postLoaders.idLoader.clearLocal(postId);
          postLoaders.idLoader.clear(postId);
          userLoaders.usernameLoader.clear(currentUser.username);
          // ]).then(res => post);
          return { _id: postId };
        } else {
          return new Error("post is not existed or not matched to user");
        }
      }
    },
    addPostComment: async (
      _,
      { body, userId, postId },
      { Post, Comment, currentUser, postLoaders }
    ) => {
      if (!currentUser || currentUser._id != userId) {
        console.log(currentUser, userId);
        throw new Error("user invalid or unauthenticated");
      } else {
        let post = await Post.findOne({ _id: postId });
        if (post) {
          let comment = await new Comment({
            body,
            user: userId
          }).save();
          // pubsub.publish(POST_CREATED, { comment });
          post.comments.unshift(comment._id);
          post.commentsSize++;
          // comment = await Comment.populate(comment, "user");
          post.save().then(doc => {
            postLoaders.idLoader.prime(postId, doc);
          });
          return comment;
        } else {
          return new Error("post is not existed!");
        }
      }
    },
    likePost: async (
      _,
      { postId, username, isLike },
      { Post, User, currentUser, postLoaders, userLoaders }
    ) => {
      // find Post, add 1 to its 'likes' value
      if (!currentUser || currentUser.username != username) {
        throw new Error("user invalid or unauthenticated");
      } else {
        let post = await Post.findOne({ _id: postId });
        if (post) {
          let user = await User.findOne({ _id: currentUser._id });
          hadLiked = user.favorites.some(id => id.equals(postId));
          if (isLike) {
            if (hadLiked) {
              return new Error("you had liked it!");
            } else {
              post.likes++;
              user.favoritesSize++;
              user.favorites.unshift(postId);
              // pubsub.publish(POST_LIKED, { user:currentUser, post });
            }
          } else {
            if (hadLiked) {
              post.likes--;
              user.favoritesSize--;
              user.favorites.splice(user.favorites.indexOf(postId), 1);
            } else {
              return new Error("you hadn't liked it!");
            }
          }
          postLoaders.idLoader.prime(postId, post);
          userLoaders.usernameLoader.prime(currentUser.username, user);
          return Promise.all([
            post.save(),
            user.save(),
            postLoaders.idLoader.loadMany(user.favorites)
          ]).then(res => {
            console.log(user.favorites, res[2]);
            return { likes: post.likes, favorites: res[2] };
          });
        } else {
          return new Error("post is not existed!");
        }
      }
    },
    // unlikePost: async (
    //   _,
    //   { postId, username },
    //   { Post, User, currentUser }
    // ) => {
    //   if (!currentUser || currentUser.username != username) return null;
    //   else {
    //     let post = await Post.findOne({ _id: postId });
    //     if (post) {
    //       post.likes--;
    //       post = await post.save();
    //       const user = await User.findOneAndUpdate(
    //         { username },
    //         {
    //           $pull: { favorites: { $each: [postId], $position: 0 } },
    //           $inc: { favoritesSize: -1 }
    //         },
    //         { new: true }
    //       ).populate({
    //         path: "favorites",
    //         model: "Post"
    //       });
    //       return Promise.all([
    //         postLoaders.idLoader.prime(postId, post),
    //         // postLoaders.idLoader.clear(postId),
    //         userLoaders.usernameLoader.prime(currentUser.username, user)
    //       ]).then(res => ({ likes: post.likes, favorites: user.favorites }));
    //     } else {
    //       return new Error("post is not existed!");
    //     }
    //   }
    // },
    signinUser: async (_, { email, password }, { User }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User not found!");
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error("Invalid password!");
      }
      // return User;
      return { token: createToken(user, process.env.SECRET, "1d") }; // "1d"
    },
    signupUser: async (_, { username, email, password }, { User }) => {
      const userHasEmail = await User.findOne({ email });
      if (userHasEmail) {
        throw new Error("Email already exists!");
      }
      const userHasName = await User.findOne({ username });
      if (userHasName) {
        throw new Error("User already exists!");
      }
      const newUser = await new User({
        username,
        email,
        password
      }).save();
      // return newUser;
      return { token: createToken(newUser, process.env.SECRET, "1d") };
    }

    /* test
    curl localhost:4000 \
      -F operations='{ "query": "mutation ($file: Upload!) { singleUpload(file: $file) {  id\n path\n filename\n mimetype } }", "variables": { "file": null } }' \
      -F map='{ "0": ["variables.file"] }' \
      -F 0=@xxx.jpg
    */
    // singleUpload: async (parent, { file }, { File }) => {
    //   const { createReadStream, filename, mimetype } = await file;
    //   const stream = createReadStream(); //
    //   const { id, path } = await storeFS({ stream, filename });
    //   const newFile = new File({ id, filename, mimetype, path }).save();
    //   return newFile;
    // }
  }
};
