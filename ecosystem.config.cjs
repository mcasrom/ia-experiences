module.exports = {
  apps: [
    {
      name: "ia",
      script: "./dist/server.cjs",
      env_production: {
        NODE_ENV: "production",
        PORT: 3016
      }
    }
  ]
};
