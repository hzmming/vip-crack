module.exports = {
  plugins: [
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-class-properties",
  ],
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
  ],
  // 子目录使用自己的配置文件 .babelrc.js/json
  babelrcRoots: [".", "packages/*"],
};
