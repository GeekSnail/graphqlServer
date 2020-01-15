const { AuthenticationError } = require("apollo-server-express");
const jwt = require("jsonwebtoken");
exports.getUserbyToken = async token => {
  if (token) {
    try {
      let user = await jwt.verify(token, process.env.SECRET);
      console.log("[user]", user, Date.now());
      return user;
    } catch (err) {
      throw new AuthenticationError(
        "Your session has expired. Please sign in again."
      );
    }
  }
};
// const getUser = async token => {
//   if (token) {
//     try {
//       let user = await jwt.verify(token, process.env.SECRET);
//       console.log("[user]", user, Date.now());
//       return user;
//     } catch (err) {
//       throw new AuthenticationError(
//         "Your session has expired. Please sign in again."
//       );
//     }
//   }
// };
