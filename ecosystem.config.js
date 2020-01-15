module.exports = {
  apps: [
    {
      name: "graphqlServer",
      script: "server.js",
      output: "./logs/out.log",
      error: "./logs/error.log",
      env: {
        COMMON_VARIABLE: "true",
        NODE_ENV: "development"
      },
      env_production: {
        NOED_ENV: "production"
      }
    }
  ],
  deploy: {
    production: {
      user: "me",
      host: ["101.132.144.238"],
      port: "39999",
      ref: "origin/v0.0.1",
      repo: "git@github.com:<yourname>/<repository>.git",
      path: "/var/www/graphqlServer",
      "post-deploy": "npm install",
      ssh_options: "StrictHostKeyChecking=no",
      env: {
        NODE_ENV: "production"
      }
    }
  }
};
