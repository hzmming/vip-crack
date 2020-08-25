module.exports = {
  preset: "jest-puppeteer",
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./test/api/.babelrc.js" }], // 路径相对 pwd()
  },
};
