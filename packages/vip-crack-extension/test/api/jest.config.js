module.exports = {
  testEnvironment: "node",
  verbose: true,
  // 指定 babel 配置文件
  // https://github.com/facebook/jest/issues/3845#issuecomment-582511237
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./test/api/.babelrc.js" }], // 路径相对 pwd()
  },
};
