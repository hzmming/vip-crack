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
};
