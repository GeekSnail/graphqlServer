const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    // post: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    //   ref: "Post"
    // },
    body: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  },
  {
    timestamps: { createdAt: "created", updatedAt: "updated" }
  }
);
module.exports = mongoose.model("Comment", CommentSchema);
