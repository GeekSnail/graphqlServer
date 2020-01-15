//const { ApolloServer, AuthenticationError } = require("apollo-server");
const http = require("http");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
// const mongoose = require("mongoose");
//const DataLoader = require("dataloader");
const fs = require("fs");
const path = require("path");
// const jwt = require("jsonwebtoken");
//const client = require("./redis");
// const { mkdirsSync } = require("./utils/mkdirs");
// const { execute, subscribe } = "graphql";
//const { PubSub } = require('apollo-server');
const { log, logreq } = require("./utils/log_config");
require("./utils/mongoose");
const redis = require("./utils/redis");
const typeDefsPath = path.join(__dirname, "typeDefs.gql");
const typeDefs = fs.readFileSync(typeDefsPath, "utf-8");
const resolvers = require("./resolvers");
const loaders = require("./loaders");
const models = require("./models");
const { getUserbyToken } = require("./utils/getUserByToken");
// import environment variables and mongoose models
// const isProd = process.env.NODE_ENV === "production";
// if (isProd) require("dotenv").config({ path: "process.prod.env" });
// else require("dotenv").config({ path: "process.env" });

// mongoose
//   .connect(process.env.MONGO_URI, {
//     auth: isProd ? { authSource: "admin" } : false,
//     autoIndex: isProd ? false : true,
//     useNewUrlParser: true
//   })
//   .then(() => console.log(`MongoDB connected ${isProd ? "prod" : "dev"}.`))
//   .catch(err => console.error(err));

const corsOptions = {
  origin: JSON.parse(process.env.whitelist),
  methods: "GET,POST,OPTIONS",
  credentials: true
};
const app = express();
// Additional middleware can be mounted at this point to run before Apollo.
app.use(express.static(process.env.STATIC_DIR));
app.disable("x-powered-by");

// create Apollo/GraphQL Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: async (connectionParams, webSocket, context) => {
      console.log("client ---> ws...");
      if (connectionParams.authToken) {
        return {
          currentUser: await getUserbyToken(connectionParams.authToken)
        };
      }
      //throw new Error("Missing auth token!");
    },
    onDisconnect: (webSocket, context) => {
      console.log("client ---xXx--- ws.");
    }
  },
  introspection: true, //要在生产中启用GraphQL Playground
  //playground: true, //要在生产中启用GraphQL Playground
  playground: {
    // settings: {
    //   "editor.theme": "light"
    // }
  },
  formatError: error => ({
    //https://medium.com/@tarkus/validation-and-user-errors-in-graphql-mutations-39ca79cd00bf
    name: error.name, //extensions
    message: error.message.replace("Context creation failed: ", ""),
    state: error.originalError && error.originalError.state,
    locations: error.locations,
    path: error.path
  }),
  context: async ({ req, connection }) => {
    logreq(req, connection);
    if (connection) {
      // check connection for metadata
      console.log("check ws connection");
      return connection.context;
    } else {
      // check from req
      console.log("check req");
      const token = req.headers.authorization || "";
      console.log(token);
      let currentUser = await getUserbyToken(token);
      console.log("cur", currentUser);
      //const token = req.headers["authorization"];
      return {
        ...models,
        ...loaders,
        redis,
        currentUser
      };
    }
  }
});

server.applyMiddleware({ app, path: "/graphql", cors: corsOptions });
// server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
//   console.log(`Server listening on ${url}`);
// });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);
// ⚠️ Pay attention to the fact that we are calling `listen` on the http server variable, and not on `app`.
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server ready at http://localhost:${PORT || 4000}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${PORT}${
      server.subscriptionsPath
    }`
  );
});

// app.listen({ port: process.env.PORT || 4000 }, () => {
//   log.info(
//     `Server listening on ${process.env.HOST}${process.env.PORT ? "4000" : ""}${
//       server.graphqlPath
//     }`
//   );
// });
