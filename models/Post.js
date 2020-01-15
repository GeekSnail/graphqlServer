const mongoose = require("mongoose");
const User = require("./User");
const Comment = require("./Comment");

const PostSchema = new mongoose.Schema(
  {
    // title: {
    //   type: String,
    //   required: true
    // },
    // imageUrl: {
    //   type: String,
    //   required: true
    // },
    image: {
      url: {
        type: String,
        required: true
      },
      naturalWidth: {
        type: Number,
        required: true
      },
      naturalHeight: {
        type: Number,
        required: true
      }
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    description: {
      type: String,
      index: true,
      required: true
    },
    // createdDate: {
    //   type: Date,
    //   default: new Date()
    // },
    likes: {
      type: Number,
      default: 0
    },
    // property ('createdBy') === path
    // ref ('User') === model
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: "User"
    // },
    createdBy: {
      type: String,
      required: true,
      index: true
    },
    commentsSize: {
      type: Number,
      default: 0
    },
    comments: {
      // {
      //   messageBody: {
      //     type: String,
      //     required: true
      //   },
      //   messageDate: {
      //     type: Date,
      //     default: Date.now
      //   },
      //   messageUser: {
      //     type: mongoose.Schema.Types.ObjectId,
      //     required: true,
      //     ref: "User"
      //   }
      // }
      type: [mongoose.Schema.Types.ObjectId], //
      required: true,
      ref: "Comment"
    }
  },
  {
    timestamps: { createdAt: "created", updatedAt: "updated" },
    toJSON: { virtuals: true }
  }
);
//https://mongoosejs.com/docs/populate.html#populate-virtuals
//https://github.com/Automattic/mongoose/issues/6879#issuecomment-414065751
PostSchema.virtual("author", {
  ref: "User",
  localField: "createdBy",
  foreignField: "username",
  justOne: true
});

PostSchema.pre("remove", { query: true }, function(doc) {
  console.log(doc, "Removing!");
});
PostSchema.post("findOneAndRemove", { query: true, doc: true }, function(doc) {
  console.log("laaa", doc);
  // console.log(this.model("User"));
  let delComments = Comment.remove({ _id: { $in: doc.comments } });
  let updUser = User.findOneAndUpdate(
    { username: doc.createdBy },
    { $pull: { posts: doc._id }, $inc: { postsSize: -1 } }
  );
  let updFavorites = User.update(
    { favorites: { $in: [doc._id] } },
    { $pull: { favorites: doc._id }, $inc: { favoritesSize: -1 } }
  );
  Promise.all([delComments, updUser, updFavorites])
    .then(res => {
      console.log("user", res[1].username, "remove post", res[1].posts[0]);
    })
    .catch(err => console.log(err));
});

// https://docs.mongodb.com/manual/core/index-text/#wildcard-text-indexes
// PostSchema.index({
//   "$**": "text"
// });
module.exports = mongoose.model("Post", PostSchema);
