const shortid = require("shortid");
const fs = require("fs");
// const sizeOf = require("image-size");
// const streamToBuffer = require("stream-to-buffer");

const storeFS = ({ stream, mimetype }) => {
  const id = shortid.generate();
  const path = `${process.env.UPLOAD_DIR}/${id}.${mimetype.split("/")[1]}`;
  return new Promise((resolve, reject) => {
    // streamToBuffer(stream, (err, buffer) => {
    //   if (err) throw new Error(err);
    //   sizeOf(buffer).then(dimensions => { console.log(dimensions.width, dimensions.height); })
    //     .catch(err => console.error(err));
    // });
    stream
      .on("error", error => {
        if (stream.truncated)
          // Delete the truncated file.
          fs.unlinkSync(path);
        reject(error);
      })
      .pipe(fs.createWriteStream(path))
      .on("error", error => reject(error))
      .on("finish", () => resolve({ path }));
  });
};

exports.uploadFile = async file => {
  const { createReadStream, filename, mimetype, encoding } = await file;
  if (mimetype.split("/")[0] != "image") {
    throw new Error("File type not supported");
  } else {
    const stream = createReadStream(); //
    let { path } = await storeFS({ stream, mimetype }); //local
    console.log(path);
    path =
      "http://" + process.env.HOST + path.substr(path.lastIndexOf("/photos")); //static
    console.log(path);
    return { filename, mimetype, path };
  }
};

// const cloudinary = require("cloudinary");
// const streamToBuffer = require("stream-to-buffer");

// exports.uploadFile = async file => {
//   const { filename, mimetype, encoding, createReadStream } = await file;
//   const stream = createReadStream();
//   // process image
//   return new Promise((resolve, reject) => {
//     // if (!Object.is(mimetype, "image/jpeg")) {
//     //   throw new Error("File type not supported");
//     // }

//     cloudinary.config({
//       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//       api_key: process.env.CLOUDINARY_API_KEY,
//       api_secret: process.env.CLOUDINARY_API_SECRET
//     });
//     streamToBuffer(stream, (err, buffer) => {
//       const uploadStream = cloudinary.v2.uploader
//         .upload_stream({ resource_type: "image" }, (err, result) => {
//           console.log("result", result);
//           if (err) {
//             throw new Error("File not uploaded!");
//           }
//           return resolve(result.url);
//         })
//         .end(buffer);
//     });
//   });
// };
