const mongoose = require("mongoose");
const md5 = require("md5");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String
    },
    // joinDate: {
    //   type: Date,
    //   default: new Date()
    // },
    postsSize: {
      type: Number,
      default: 0
    },
    posts: {
      type: [mongoose.Schema.Types.ObjectId], //
      required: true,
      ref: "Post"
    },
    favoritesSize: {
      type: Number,
      default: 0
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId], //
      required: true,
      ref: "Post"
    },
    collectionsSize: {
      type: Number,
      default: 0
    },
    collections: {
      type: [mongoose.Schema.Types.ObjectId], //
      required: true,
      ref: "Post"
    }
  },
  {
    timestamps: { createdAt: "created", updatedAt: "updated" }
  }
);
// UserSchema.index({username:1,type:1})
// PostSchema.pre('save', function (next) {
//   if ('invalid' == this.favoritesSize) {
//     return next(new Error('#sadpanda'));
//   }
//   next();
// });
// Create and add avatar to new user
UserSchema.pre("save", function(next) {
  this.avatar = `https://www.gravatar.com/avatar/${md5(
    this.email
  )}?d=identicon&f=y`;
  next();
});

// Hash password
UserSchema.pre("save", function(next) {
  if (!this.isModified("password")) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

// UserSchema.virtual("favoritesLength").get(function() {
//   return this.favorites.length;
// });

module.exports = mongoose.model("User", UserSchema);
