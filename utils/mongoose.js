const mongoose = require("mongoose");

const isProd = process.env.NODE_ENV === "production";
if (isProd) require("dotenv").config({ path: "process.prod.env" });
else require("dotenv").config({ path: "process.env" });

mongoose
  .connect(process.env.MONGO_URI, {
    auth: isProd ? { authSource: "admin" } : false,
    autoIndex: isProd ? false : true,
    useNewUrlParser: true
  })
  .then(() => console.log(`MongoDB connected ${isProd ? "prod" : "dev"}.`))
  .catch(err => console.error(err));
