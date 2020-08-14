module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2020: true,
    jest: true,
    webextensions: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
  },
  rules: {},
};
