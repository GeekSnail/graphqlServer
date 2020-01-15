const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimetype: {
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
});
module.exports = mongoose.model("Image", ImageSchema);
